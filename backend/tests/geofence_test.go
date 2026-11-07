package tests

import (
	"testing"
	"time"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/utils"
)

func TestPolygonValidationAndClosure(t *testing.T) {
	// Test 1: Coordinates validation - less than 3 coords
	invalidReq := models.CreateGeofenceRequest{
		Name:     "Too few points",
		Category: models.CategoryDeliveryZone,
		Coordinates: []models.Coordinate{
			{37.7749, -122.4194},
			{37.7752, -122.4178},
		},
	}
	if err := invalidReq.Validate(); err == nil {
		t.Errorf("Expected error for polygon with < 3 coordinates, got nil")
	}

	// Test 2: Valid unclosed polygon gets auto-closed
	unclosedReq := models.CreateGeofenceRequest{
		Name:     "Auto-close polygon",
		Category: models.CategoryDeliveryZone,
		Coordinates: []models.Coordinate{
			{37.7749, -122.4194},
			{37.7752, -122.4178},
			{37.7735, -122.4167},
		},
	}
	if err := unclosedReq.Validate(); err != nil {
		t.Fatalf("Failed to validate unclosed polygon: %v", err)
	}
	if len(unclosedReq.Coordinates) != 4 {
		t.Errorf("Expected 4 coordinates after auto-closure, got %d", len(unclosedReq.Coordinates))
	}
	first := unclosedReq.Coordinates[0]
	last := unclosedReq.Coordinates[len(unclosedReq.Coordinates)-1]
	if first[0] != last[0] || first[1] != last[1] {
		t.Errorf("Polygon first point %v does not match last point %v", first, last)
	}

	// Test 3: Invalid latitude/longitude bounds
	outOfBoundsReq := models.CreateGeofenceRequest{
		Name:     "Out of bounds",
		Category: models.CategoryRestrictedZone,
		Coordinates: []models.Coordinate{
			{95.0000, -122.4194}, // Invalid lat > 90
			{37.7752, -122.4178},
			{37.7735, -122.4167},
		},
	}
	if err := outOfBoundsReq.Validate(); err == nil {
		t.Errorf("Expected error for latitude > 90, got nil")
	}

	// Test 4: Invalid category
	invalidCatReq := models.CreateGeofenceRequest{
		Name:     "Invalid category",
		Category: models.GeofenceCategory("unsupported_zone"),
		Coordinates: []models.Coordinate{
			{37.7749, -122.4194},
			{37.7752, -122.4178},
			{37.7735, -122.4167},
		},
	}
	if err := invalidCatReq.Validate(); err == nil {
		t.Errorf("Expected error for invalid category, got nil")
	}
}

func TestWKTConversion(t *testing.T) {
	coords := []models.Coordinate{
		{37.7890, -122.4120},
		{37.7920, -122.4040},
		{37.7850, -122.4000},
		{37.7890, -122.4120},
	}

	wkt, err := utils.CoordinatesToWKT(coords)
	if err != nil {
		t.Fatalf("CoordinatesToWKT failed: %v", err)
	}

	// PostGIS expects (longitude latitude) order
	expectedPrefix := "SRID=4326;POLYGON((-122.412000 37.789000"
	if len(wkt) < len(expectedPrefix) || wkt[:len(expectedPrefix)] != expectedPrefix {
		t.Errorf("WKT output %s does not begin with expected (lon lat) sequence: %s", wkt, expectedPrefix)
	}
}

func TestPointInPolygonAlgorithm(t *testing.T) {
	// Define a square polygon around (37.78, -122.41)
	polygon := []models.Coordinate{
		{37.7700, -122.4200}, // bottom-left
		{37.7900, -122.4200}, // top-left
		{37.7900, -122.4000}, // top-right
		{37.7700, -122.4000}, // bottom-right
		{37.7700, -122.4200}, // closed
	}

	// 1. Point strictly inside
	insidePoint := models.Coordinate{37.7800, -122.4100}
	if !utils.PointInPolygon(insidePoint, polygon) {
		t.Errorf("Expected point %v to be inside polygon", insidePoint)
	}

	// 2. Point strictly outside
	outsidePoint := models.Coordinate{37.8000, -122.4300}
	if utils.PointInPolygon(outsidePoint, polygon) {
		t.Errorf("Expected point %v to be outside polygon", outsidePoint)
	}

	// 3. Point far away
	farPoint := models.Coordinate{40.7128, -74.0060} // New York City
	if utils.PointInPolygon(farPoint, polygon) {
		t.Errorf("Expected far point %v to be outside polygon", farPoint)
	}
}

func TestVehicleRequestValidation(t *testing.T) {
	vReq := models.CreateVehicleRequest{
		VehicleNumber: "KA-01-AB-1234",
		DriverName:    "John Doe",
		VehicleType:   models.VehicleTypeTruck,
		PhoneNumber:   "+1234567890",
	}
	if err := vReq.Validate(); err != nil {
		t.Errorf("Expected valid vehicle request, got: %v", err)
	}

	invalidTypeReq := models.CreateVehicleRequest{
		VehicleNumber: "KA-01-AB-1234",
		DriverName:    "John Doe",
		VehicleType:   models.VehicleType("spaceship"),
		PhoneNumber:   "+1234567890",
	}
	if err := invalidTypeReq.Validate(); err == nil {
		t.Errorf("Expected error for invalid vehicle type, got nil")
	}
}

func TestLocationUpdateRequestValidation(t *testing.T) {
	locReq := models.LocationUpdateRequest{
		Latitude:  37.7749,
		Longitude: -122.4194,
		Timestamp: time.Now(),
	}
	// Missing vehicle ID
	if err := locReq.Validate(); err == nil {
		t.Errorf("Expected error for nil vehicle_id, got nil")
	}
}
