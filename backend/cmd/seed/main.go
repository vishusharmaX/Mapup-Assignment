package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/google/uuid"

	"fleetpulse/backend/internal/config"
	"fleetpulse/backend/internal/database"
	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/utils"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	geofenceRepo := repositories.NewGeofenceRepository(pool)
	vehicleRepo := repositories.NewVehicleRepository(pool)
	alertRepo := repositories.NewAlertRepository(pool)

	log.Println("Seeding demo data for FleetPulse...")

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
			log.Printf("Vehicle %s already exists, using existing record\n", vReq.VehicleNumber)
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
			log.Printf("Failed to seed vehicle %s: %v\n", vReq.VehicleNumber, err)
			continue
		}
		log.Printf("Seeded vehicle: %s (%s)\n", v.VehicleNumber, v.VehicleType)
		createdVehicles = append(createdVehicles, v)
	}

	// 2. Seed Sample Geofences (Centred around San Francisco / Bay Area for clear testing)
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
				{37.7890, -122.4120}, // closed
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
	for _, gDef := range geofences {
		existingList, _ := geofenceRepo.List(ctx, nil)
		var found *models.Geofence
		for _, eg := range existingList {
			if eg.Name == gDef.Name {
				found = &eg
				break
			}
		}

		if found != nil {
			log.Printf("Geofence '%s' already exists\n", gDef.Name)
			createdGeofences = append(createdGeofences, found)
			continue
		}

		wkt, err := utils.CoordinatesToWKT(gDef.Coords)
		if err != nil {
			log.Printf("Failed to generate WKT for %s: %v\n", gDef.Name, err)
			continue
		}

		g := &models.Geofence{
			ID:          uuid.New(),
			Name:        gDef.Name,
			Description: gDef.Description,
			Category:    gDef.Category,
			Coordinates: gDef.Coords,
			IsActive:    true,
		}

		if err := geofenceRepo.Create(ctx, g, wkt); err != nil {
			log.Printf("Failed to seed geofence %s: %v\n", gDef.Name, err)
			continue
		}
		log.Printf("Seeded geofence: %s (%s)\n", g.Name, g.Category)
		createdGeofences = append(createdGeofences, g)
	}

	// 3. Seed Sample Alert Rules
	if len(createdGeofences) >= 2 {
		// Rule 1: Restricted zone alert for all vehicles (Global rule)
		restrictedZone := createdGeofences[1]
		rules, _ := alertRepo.List(ctx, &restrictedZone.ID, nil)
		if len(rules) == 0 {
			rule1 := &models.AlertRule{
				ID:         uuid.New(),
				GeofenceID: restrictedZone.ID,
				VehicleID:  nil, // Global
				EventType:  models.AlertEventBoth,
				IsActive:   true,
			}
			_ = alertRepo.Create(ctx, rule1)
			log.Printf("Seeded Global Alert Rule: '%s' (Entry & Exit)\n", restrictedZone.Name)
		}

		// Rule 2: Delivery zone entry rule for first vehicle
		if len(createdVehicles) > 0 {
			deliveryZone := createdGeofences[0]
			veh := createdVehicles[0]
			rule2 := &models.AlertRule{
				ID:         uuid.New(),
				GeofenceID: deliveryZone.ID,
				VehicleID:  &veh.ID,
				EventType:  models.AlertEventEntry,
				IsActive:   true,
			}
			_ = alertRepo.Create(ctx, rule2)
			log.Printf("Seeded Vehicle-Specific Alert Rule: '%s' on '%s' for vehicle %s\n", rule2.EventType, deliveryZone.Name, veh.VehicleNumber)
		}
	}

	log.Println("Seeding completed successfully!")
}

func prettyPrint(v any) string {
	b, _ := json.MarshalIndent(v, "", "  ")
	return string(b)
}
