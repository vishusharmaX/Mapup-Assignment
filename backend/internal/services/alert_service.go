package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
)

type AlertService interface {
	Configure(ctx context.Context, req models.ConfigureAlertRequest) (*models.AlertRule, error)
	List(ctx context.Context, geofenceID, vehicleID *uuid.UUID) ([]models.AlertRule, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.AlertRule, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Toggle(ctx context.Context, id uuid.UUID, isActive bool) error
}

type alertService struct {
	repo         repositories.AlertRepository
	geofenceRepo repositories.GeofenceRepository
	vehicleRepo  repositories.VehicleRepository
}

func NewAlertService(
	repo repositories.AlertRepository,
	geofenceRepo repositories.GeofenceRepository,
	vehicleRepo repositories.VehicleRepository,
) AlertService {
	return &alertService{
		repo:         repo,
		geofenceRepo: geofenceRepo,
		vehicleRepo:  vehicleRepo,
	}
}

func (s *alertService) Configure(ctx context.Context, req models.ConfigureAlertRequest) (*models.AlertRule, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	geofence, err := s.geofenceRepo.GetByID(ctx, req.GeofenceID)
	if err != nil {
		return nil, err
	}
	if geofence == nil {
		return nil, fmt.Errorf("geofence with id '%s' not found", req.GeofenceID)
	}

	if req.VehicleID != nil && *req.VehicleID != uuid.Nil {
		vehicle, err := s.vehicleRepo.GetByID(ctx, *req.VehicleID)
		if err != nil {
			return nil, err
		}
		if vehicle == nil {
			return nil, fmt.Errorf("vehicle with id '%s' not found", *req.VehicleID)
		}
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	rule := &models.AlertRule{
		ID:         uuid.New(),
		GeofenceID: req.GeofenceID,
		VehicleID:  req.VehicleID,
		EventType:  req.EventType,
		IsActive:   isActive,
	}

	if err := s.repo.Create(ctx, rule); err != nil {
		return nil, err
	}

	// Re-fetch populated rule with joined vehicle and geofence names
	return s.repo.GetByID(ctx, rule.ID)
}

func (s *alertService) List(ctx context.Context, geofenceID, vehicleID *uuid.UUID) ([]models.AlertRule, error) {
	return s.repo.List(ctx, geofenceID, vehicleID)
}

func (s *alertService) GetByID(ctx context.Context, id uuid.UUID) (*models.AlertRule, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *alertService) Delete(ctx context.Context, id uuid.UUID) error {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("alert rule not found")
	}
	return s.repo.Delete(ctx, id)
}

func (s *alertService) Toggle(ctx context.Context, id uuid.UUID, isActive bool) error {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("alert rule not found")
	}
	return s.repo.ToggleActive(ctx, id, isActive)
}

