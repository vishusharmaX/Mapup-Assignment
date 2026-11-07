package services

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/websocket"
)

type TrackingService interface {
	ProcessLocation(ctx context.Context, req models.LocationUpdateRequest) (*models.LocationUpdateResponse, error)
}

type trackingService struct {
	pool          *pgxpool.Pool
	vehicleRepo   repositories.VehicleRepository
	geofenceRepo  repositories.GeofenceRepository
	stateRepo     repositories.StateRepository
	alertRepo     repositories.AlertRepository
	violationRepo repositories.ViolationRepository
	wsHub         *websocket.Hub
}

func NewTrackingService(
	pool *pgxpool.Pool,
	vehicleRepo repositories.VehicleRepository,
	geofenceRepo repositories.GeofenceRepository,
	stateRepo repositories.StateRepository,
	alertRepo repositories.AlertRepository,
	violationRepo repositories.ViolationRepository,
	wsHub *websocket.Hub,
) TrackingService {
	return &trackingService{
		pool:          pool,
		vehicleRepo:   vehicleRepo,
		geofenceRepo:  geofenceRepo,
		stateRepo:     stateRepo,
		alertRepo:     alertRepo,
		violationRepo: violationRepo,
		wsHub:         wsHub,
	}
}

func (s *trackingService) ProcessLocation(ctx context.Context, req models.LocationUpdateRequest) (*models.LocationUpdateResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// 1. Begin Database Transaction
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// 2. Lock vehicle row for update (ensures serialized processing per vehicle)
	vehicle, err := s.vehicleRepo.LockVehicleForUpdate(ctx, tx, req.VehicleID)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return nil, fmt.Errorf("vehicle with id '%s' not found", req.VehicleID)
	}

	// 3. Record location point in vehicle_locations history
	if err := s.vehicleRepo.RecordLocationTx(ctx, tx, req.VehicleID, req.Latitude, req.Longitude, req.Timestamp); err != nil {
		return nil, fmt.Errorf("failed to record location history: %w", err)
	}

	// 4. Update vehicle's last known coordinates and status to active
	if err := s.vehicleRepo.UpdateVehiclePositionTx(ctx, tx, req.VehicleID, req.Latitude, req.Longitude, req.Timestamp, models.VehicleStatusActive); err != nil {
		return nil, fmt.Errorf("failed to update vehicle position: %w", err)
	}

	// 5. Query active geofences covering the coordinates (longitude, latitude)
	coveringGeofences, err := s.geofenceRepo.FindCoveringGeofences(ctx, req.Longitude, req.Latitude)
	if err != nil {
		return nil, fmt.Errorf("failed to find covering geofences: %w", err)
	}

	currentCoveringMap := make(map[uuid.UUID]models.Geofence)
	for _, g := range coveringGeofences {
		currentCoveringMap[g.ID] = g
	}

	// 6. Retrieve previous membership states for this vehicle
	prevStates, err := s.stateRepo.GetStatesForVehicleTx(ctx, tx, req.VehicleID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve vehicle geofence states: %w", err)
	}

	type transitionInfo struct {
		eventType string
		geofence  models.Geofence
	}
	var detectedTransitions []transitionInfo

	// 7. Detect ENTRY transitions:
	// A geofence is in currentCoveringMap, but was NOT previously inside
	for gID, geofence := range currentCoveringMap {
		wasInside := prevStates[gID]
		if !wasInside {
			detectedTransitions = append(detectedTransitions, transitionInfo{
				eventType: "entry",
				geofence:  geofence,
			})
			if err := s.stateRepo.UpsertStateTx(ctx, tx, req.VehicleID, gID, true, "entry"); err != nil {
				return nil, fmt.Errorf("failed to update geofence state: %w", err)
			}
		}
	}

	// 8. Detect EXIT transitions:
	// A geofence was previously inside, but is NOT in currentCoveringMap
	for prevGID, wasInside := range prevStates {
		if wasInside {
			if _, isStillInside := currentCoveringMap[prevGID]; !isStillInside {
				// Vehicle exited this geofence
				geofence, err := s.geofenceRepo.GetByID(ctx, prevGID)
				if err != nil || geofence == nil {
					continue
				}
				detectedTransitions = append(detectedTransitions, transitionInfo{
					eventType: "exit",
					geofence:  *geofence,
				})
				if err := s.stateRepo.UpsertStateTx(ctx, tx, req.VehicleID, prevGID, false, "exit"); err != nil {
					return nil, fmt.Errorf("failed to update geofence exit state: %w", err)
				}
			}
		}
	}

	var responseEvents []models.DetectedTransitionEvent
	var wsAlertEvents []models.WebSocketAlertEvent

	// 9. Process detected transitions against configured alert rules
	for _, t := range detectedTransitions {
		matchingRules, err := s.alertRepo.FindMatchingRulesTx(ctx, tx, t.geofence.ID, req.VehicleID, t.eventType)
		if err != nil {
			return nil, fmt.Errorf("failed to check alert rules: %w", err)
		}

		// Also auto-flag restricted zone entry as a violation if no explicit rule is configured,
		// or if any matching rule exists
		shouldPersistViolation := len(matchingRules) > 0 || (t.geofence.Category == models.CategoryRestrictedZone && t.eventType == "entry")

		var alertRuleID *uuid.UUID
		if len(matchingRules) > 0 {
			alertRuleID = &matchingRules[0].ID
		}

		if shouldPersistViolation {
			violationID := uuid.New()
			violation := &models.Violation{
				ID:          violationID,
				EventType:   t.eventType,
				VehicleID:   req.VehicleID,
				GeofenceID:  t.geofence.ID,
				AlertRuleID: alertRuleID,
				Latitude:    req.Latitude,
				Longitude:   req.Longitude,
				Timestamp:   req.Timestamp,
			}

			if err := s.violationRepo.CreateTx(ctx, tx, violation); err != nil {
				return nil, fmt.Errorf("failed to persist violation: %w", err)
			}

			// Add to response events
			responseEvents = append(responseEvents, models.DetectedTransitionEvent{
				EventID:      violationID,
				EventType:    t.eventType,
				GeofenceID:   t.geofence.ID,
				GeofenceName: t.geofence.Name,
				Category:     t.geofence.Category,
				Timestamp:    req.Timestamp,
			})

			// Add to WebSocket broadcast list
			wsAlertEvents = append(wsAlertEvents, models.WebSocketAlertEvent{
				EventID:   violationID.String(),
				EventType: t.eventType,
				Timestamp: req.Timestamp.UTC().Format(time.RFC3339),
				Vehicle: models.WSVehicleInfo{
					VehicleID:     vehicle.ID.String(),
					VehicleNumber: vehicle.VehicleNumber,
					DriverName:    vehicle.DriverName,
				},
				Geofence: models.WSGeofenceInfo{
					GeofenceID:   t.geofence.ID.String(),
					GeofenceName: t.geofence.Name,
					Category:     string(t.geofence.Category),
				},
				Location: models.WSLocationInfo{
					Latitude:  req.Latitude,
					Longitude: req.Longitude,
				},
			})
		}
	}

	// 10. Commit the transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit location update transaction: %w", err)
	}

	// 11. Broadcast WebSocket alerts asynchronously AFTER transaction commit
	if s.wsHub != nil && len(wsAlertEvents) > 0 {
		for _, wsEvent := range wsAlertEvents {
			eventCopy := wsEvent
			go func() {
				slog.Info("Broadcasting geofence transition alert",
					"event_id", eventCopy.EventID,
					"type", eventCopy.EventType,
					"vehicle", eventCopy.Vehicle.VehicleNumber,
					"geofence", eventCopy.Geofence.GeofenceName,
				)
				s.wsHub.BroadcastEvent(eventCopy)
			}()
		}
	}

	// 12. Build response
	currentGeofencesInfo := make([]models.CurrentGeofenceInfo, 0, len(coveringGeofences))
	for _, g := range coveringGeofences {
		currentGeofencesInfo = append(currentGeofencesInfo, models.CurrentGeofenceInfo{
			GeofenceID:   g.ID,
			GeofenceName: g.Name,
			Category:     g.Category,
		})
	}

	if responseEvents == nil {
		responseEvents = make([]models.DetectedTransitionEvent, 0)
	}

	return &models.LocationUpdateResponse{
		VehicleID:        req.VehicleID,
		Latitude:         req.Latitude,
		Longitude:        req.Longitude,
		Timestamp:        req.Timestamp,
		CurrentGeofences: currentGeofencesInfo,
		Events:           responseEvents,
	}, nil
}
