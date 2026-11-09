package database

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/utils"
)

// SeedDemoData seeds initial demo vehicles, geofences, and alert rules if the database is empty.
func SeedDemoData(ctx context.Context, pool *pgxpool.Pool) error {
	geofenceRepo := repositories.NewGeofenceRepository(pool)
	vehicleRepo := repositories.NewVehicleRepository(pool)
	alertRepo := repositories.NewAlertRepository(pool)

	count, err := geofenceRepo.Count(ctx)
	if err == nil && count > 0 {
		slog.Info("Database already populated, skipping auto-seed", "geofences_count", count)
		return nil
	}

	slog.Info("Populating demo fleet, geofences, and alert rules...")

	// 1. Seed Sample Vehicles
	vehicles := []models.CreateVehicleRequest{
		{
			VehicleNumber: "KA-01-AB-1234",
			DriverName:    "John Doe",
			VehicleType:   models.VehicleTypeTruck,
			PhoneNumber:   "+1 (555) 234-5678",
		},
		{
			VehicleNumber: "DL-03-XY-9876",
			DriverName:    "Sarah Jenkins",
			VehicleType:   models.VehicleTypeVan,
			PhoneNumber:   "+1 (555) 345-6789",
		},
		{
			VehicleNumber: "MH-12-CD-5432",
			DriverName:    "Mike Rodriguez",
			VehicleType:   models.VehicleTypeCar,
			PhoneNumber:   "+1 (555) 456-7890",
		},
		{
			VehicleNumber: "KA-05-EV-8821",
			DriverName:    "Alex Chen",
			VehicleType:   models.VehicleTypeMotorcycle,
			PhoneNumber:   "+1 (555) 567-8901",
		},
	}

	createdVehicles := make([]*models.Vehicle, 0)
	for _, vReq := range vehicles {
		existing, _ := vehicleRepo.GetByNumber(ctx, vReq.VehicleNumber)
		if existing != nil {
			createdVehicles = append(createdVehicles, existing)
			continue
		}

		v := &models.Vehicle{
			ID:            uuid.New(),
			VehicleNumber: vReq.VehicleNumber,
			DriverName:    vReq.DriverName,
			VehicleType:   vReq.VehicleType,
			PhoneNumber:   vReq.PhoneNumber,
			Status:        models.VehicleStatusIdle,
		}
		if err := vehicleRepo.Create(ctx, v); err != nil {
			slog.Warn("Failed to seed vehicle", "number", vReq.VehicleNumber, "error", err)
			continue
		}
		createdVehicles = append(createdVehicles, v)
	}

	// 2. Seed Sample Geofences (San Francisco / Bay Area)
	geofences := []struct {
		Name        string
		Description string
		Category    models.GeofenceCategory
		Coords      []models.Coordinate
	}{
		{
			Name:        "Downtown Commercial Delivery Zone",
			Description: "High-priority urban delivery zone covering Union Square and Market St corridor.",
			Category:    models.CategoryDeliveryZone,
			Coords: []models.Coordinate{
				{37.7890, -122.4120},
				{37.7920, -122.4040},
				{37.7850, -122.4000},
				{37.7820, -122.4090},
				{37.7890, -122.4120},
			},
		},
		{
			Name:        "Presidio Security Restricted Enclave",
			Description: "Strict military and federal restricted sector. Unauthorized entry triggers critical security alert.",
			Category:    models.CategoryRestrictedZone,
			Coords: []models.Coordinate{
				{37.8020, -122.4720},
				{37.8050, -122.4550},
				{37.7940, -122.4540},
				{37.7920, -122.4700},
				{37.8020, -122.4720},
			},
		},
		{
			Name:        "Bay Bridge Toll Plaza Zone",
			Description: "Automated toll enforcement zone for outbound freight corridors.",
			Category:    models.CategoryTollZone,
			Coords: []models.Coordinate{
				{37.7910, -122.3850},
				{37.7950, -122.3750},
				{37.7890, -122.3700},
				{37.7860, -122.3820},
				{37.7910, -122.3850},
			},
		},
		{
			Name:        "Mission Bay Customer Logistics Hub",
			Description: "Primary fulfillment and customer turnover center for expedited deliveries.",
			Category:    models.CategoryCustomerArea,
			Coords: []models.Coordinate{
				{37.7760, -122.3950},
				{37.7780, -122.3880},
				{37.7700, -122.3860},
				{37.7680, -122.3930},
				{37.7760, -122.3950},
			},
		},
	}

	createdGeofences := make([]*models.Geofence, 0)
	for _, gfData := range geofences {
		wkt, err := utils.CoordinatesToWKT(gfData.Coords)
		if err != nil {
			continue
		}

		g := &models.Geofence{
			ID:          uuid.New(),
			Name:        gfData.Name,
			Description: gfData.Description,
			Category:    gfData.Category,
			Coordinates: gfData.Coords,
			IsActive:    true,
		}

		if err := geofenceRepo.Create(ctx, g, wkt); err != nil {
			slog.Warn("Failed to seed geofence", "name", gfData.Name, "error", err)
			continue
		}
		createdGeofences = append(createdGeofences, g)
	}

	// 3. Seed Alert Rules
	var restrictedZone *models.Geofence
	var deliveryZone *models.Geofence

	for _, g := range createdGeofences {
		if g.Category == models.CategoryRestrictedZone {
			restrictedZone = g
		} else if g.Category == models.CategoryDeliveryZone {
			deliveryZone = g
		}
	}

	if restrictedZone != nil {
		rule1 := &models.AlertRule{
			ID:         uuid.New(),
			GeofenceID: restrictedZone.ID,
			VehicleID:  nil, // Global for all vehicles
			EventType:  models.AlertEventEntry,
			IsActive:   true,
		}
		_ = alertRepo.Create(ctx, rule1)
	}

	if deliveryZone != nil && len(createdVehicles) > 0 {
		rule2 := &models.AlertRule{
			ID:         uuid.New(),
			GeofenceID: deliveryZone.ID,
			VehicleID:  &createdVehicles[0].ID,
			EventType:  models.AlertEventExit,
			IsActive:   true,
		}
		_ = alertRepo.Create(ctx, rule2)
	}

	slog.Info("Demo fleet data successfully populated")
	return nil
}
