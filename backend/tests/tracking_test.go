package tests

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"fleetpulse/backend/internal/database"
	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/services"
	"fleetpulse/backend/internal/websocket"
)

func getTestDBURL() string {
	_ = godotenv.Load("../.env")
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	return "postgres://postgres:postgres@172.25.66.186:5432/fleetpulse?sslmode=disable"
}

func TestTrackingServiceTransitionsAndAlerts(t *testing.T) {
	ctx := context.Background()
	pool, err := database.NewPool(ctx, getTestDBURL())
	if err != nil {
		t.Skipf("Skipping integration test: cannot connect to database (%v)", err)
		return
	}
	defer pool.Close()

	wsHub := websocket.NewHub()
	go wsHub.Run()
	defer wsHub.Stop()

	geofenceRepo := repositories.NewGeofenceRepository(pool)
	vehicleRepo := repositories.NewVehicleRepository(pool)
	alertRepo := repositories.NewAlertRepository(pool)
	stateRepo := repositories.NewStateRepository(pool)
	violationRepo := repositories.NewViolationRepository(pool)

	trackingService := services.NewTrackingService(
		pool,
		vehicleRepo,
		geofenceRepo,
		stateRepo,
		alertRepo,
		violationRepo,
		wsHub,
	)

	// 1. Create a Test Vehicle
	testVehNumber := "TEST-" + uuid.New().String()[:8]
	testVehicle := &models.Vehicle{
		ID:            uuid.New(),
		VehicleNumber: testVehNumber,
		DriverName:    "Test Driver",
		VehicleType:   models.VehicleTypeCar,
		PhoneNumber:   "+1 555 999-0000",
		Status:        models.VehicleStatusOffline,
	}
	if err := vehicleRepo.Create(ctx, testVehicle); err != nil {
		t.Fatalf("Failed to create test vehicle: %v", err)
	}
	defer func() {
		_ = vehicleRepo.Delete(ctx, testVehicle.ID)
	}()

	// 2. Fetch seeded Restricted Zone Geofence
	geofences, err := geofenceRepo.List(ctx, nil)
	if err != nil || len(geofences) == 0 {
		t.Fatalf("Failed to list geofences: %v", err)
	}

	var targetGeofence *models.Geofence
	for _, g := range geofences {
		if g.Category == models.CategoryRestrictedZone {
			targetGeofence = &g
			break
		}
	}
	if targetGeofence == nil {
		targetGeofence = &geofences[0]
	}

	// Calculate a point inside targetGeofence and a point outside
	// Downtown SF geofence or Presidio
	insideLat := 37.8000
	insideLon := -122.4600
	outsideLat := 37.5000
	outsideLon := -122.1000

	// Step 1: Initial location outside the zone -> should NOT trigger entry
	resp1, err := trackingService.ProcessLocation(ctx, models.LocationUpdateRequest{
		VehicleID: testVehicle.ID,
		Latitude:  outsideLat,
		Longitude: outsideLon,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Step 1 ProcessLocation failed: %v", err)
	}
	if len(resp1.Events) != 0 {
		t.Errorf("Expected 0 events when outside, got %d", len(resp1.Events))
	}

	// Step 2: Move inside the zone -> Outside -> Inside = ENTRY transition
	resp2, err := trackingService.ProcessLocation(ctx, models.LocationUpdateRequest{
		VehicleID: testVehicle.ID,
		Latitude:  insideLat,
		Longitude: insideLon,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Step 2 ProcessLocation failed: %v", err)
	}
	t.Logf("Step 2 (move inside): Current geofences: %d, Events: %d", len(resp2.CurrentGeofences), len(resp2.Events))
	if len(resp2.CurrentGeofences) == 0 {
		t.Errorf("Expected at least 1 covering geofence at (%f, %f), got 0", insideLat, insideLon)
	}
	if len(resp2.Events) == 0 {
		t.Errorf("Expected entry event when moving into restricted geofence, got 0")
	} else if resp2.Events[0].EventType != "entry" {
		t.Errorf("Expected event_type 'entry', got '%s'", resp2.Events[0].EventType)
	}

	// Step 3: Move inside again -> Inside -> Inside = NO NEW EVENT (no duplicates)
	resp3, err := trackingService.ProcessLocation(ctx, models.LocationUpdateRequest{
		VehicleID: testVehicle.ID,
		Latitude:  insideLat + 0.0001,
		Longitude: insideLon + 0.0001,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Step 3 ProcessLocation failed: %v", err)
	}
	if len(resp3.Events) != 0 {
		t.Errorf("Expected 0 events for repeated inside position (no duplicate), got %d", len(resp3.Events))
	}

	// Step 4: Move outside the zone -> Inside -> Outside = EXIT transition
	resp4, err := trackingService.ProcessLocation(ctx, models.LocationUpdateRequest{
		VehicleID: testVehicle.ID,
		Latitude:  outsideLat,
		Longitude: outsideLon,
		Timestamp: time.Now().UTC(),
	})
	if err != nil {
		t.Fatalf("Step 4 ProcessLocation failed: %v", err)
	}
	t.Logf("Step 4 (move outside): Current geofences: %d, Events: %d", len(resp4.CurrentGeofences), len(resp4.Events))
	if len(resp4.Events) == 0 {
		t.Errorf("Expected exit event when moving outside geofence, got 0")
	} else if resp4.Events[0].EventType != "exit" {
		t.Errorf("Expected event_type 'exit', got '%s'", resp4.Events[0].EventType)
	}

	// Clean up state
	_ = stateRepo.ClearVehicleStates(ctx, testVehicle.ID)
}
