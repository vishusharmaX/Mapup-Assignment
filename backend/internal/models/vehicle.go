package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type VehicleType string

const (
	VehicleTypeTruck      VehicleType = "truck"
	VehicleTypeCar        VehicleType = "car"
	VehicleTypeVan        VehicleType = "van"
	VehicleTypeMotorcycle VehicleType = "motorcycle"
)

func IsValidVehicleType(t string) bool {
	switch VehicleType(t) {
	case VehicleTypeTruck, VehicleTypeCar, VehicleTypeVan, VehicleTypeMotorcycle:
		return true
	default:
		return false
	}
}

type VehicleStatus string

const (
	VehicleStatusActive  VehicleStatus = "active"
	VehicleStatusIdle    VehicleStatus = "idle"
	VehicleStatusOffline VehicleStatus = "offline"
)

type Vehicle struct {
	ID               uuid.UUID      `json:"id" db:"id"`
	VehicleNumber    string         `json:"vehicle_number" db:"vehicle_number"`
	DriverName       string         `json:"driver_name" db:"driver_name"`
	VehicleType      VehicleType    `json:"vehicle_type" db:"vehicle_type"`
	PhoneNumber      string         `json:"phone_number" db:"phone_number"`
	Status           VehicleStatus  `json:"status" db:"status"`
	LastLatitude     *float64       `json:"last_latitude,omitempty" db:"last_latitude"`
	LastLongitude    *float64       `json:"last_longitude,omitempty" db:"last_longitude"`
	LastLocationTime *time.Time     `json:"last_location_time,omitempty" db:"last_location_time"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

type CreateVehicleRequest struct {
	VehicleNumber string      `json:"vehicle_number"`
	DriverName    string      `json:"driver_name"`
	VehicleType   VehicleType `json:"vehicle_type"`
	PhoneNumber   string      `json:"phone_number"`
}

func (r *CreateVehicleRequest) Validate() error {
	if r.VehicleNumber == "" {
		return fmt.Errorf("vehicle_number is required")
	}
	if r.DriverName == "" {
		return fmt.Errorf("driver_name is required")
	}
	if !IsValidVehicleType(string(r.VehicleType)) {
		return fmt.Errorf("invalid vehicle_type '%s': must be truck, car, van, or motorcycle", r.VehicleType)
	}
	if r.PhoneNumber == "" {
		return fmt.Errorf("phone_number is required")
	}
	return nil
}

type UpdateVehicleRequest struct {
	VehicleNumber *string        `json:"vehicle_number,omitempty"`
	DriverName    *string        `json:"driver_name,omitempty"`
	VehicleType   *VehicleType   `json:"vehicle_type,omitempty"`
	PhoneNumber   *string        `json:"phone_number,omitempty"`
	Status        *VehicleStatus `json:"status,omitempty"`
}

type LocationUpdateRequest struct {
	VehicleID uuid.UUID `json:"vehicle_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}

func (r *LocationUpdateRequest) Validate() error {
	if r.VehicleID == uuid.Nil {
		return fmt.Errorf("vehicle_id is required")
	}
	if r.Latitude < -90 || r.Latitude > 90 {
		return fmt.Errorf("latitude %f must be between -90 and 90", r.Latitude)
	}
	if r.Longitude < -180 || r.Longitude > 180 {
		return fmt.Errorf("longitude %f must be between -180 and 180", r.Longitude)
	}
	if r.Timestamp.IsZero() {
		r.Timestamp = time.Now().UTC()
	}
	return nil
}

type CurrentGeofenceInfo struct {
	GeofenceID   uuid.UUID        `json:"geofence_id"`
	GeofenceName string           `json:"name"`
	Category     GeofenceCategory `json:"category"`
}

type DetectedTransitionEvent struct {
	EventID      uuid.UUID        `json:"event_id"`
	EventType    string           `json:"event_type"` // "entry" or "exit"
	GeofenceID   uuid.UUID        `json:"geofence_id"`
	GeofenceName string           `json:"geofence_name"`
	Category     GeofenceCategory `json:"category,omitempty"`
	Timestamp    time.Time        `json:"timestamp"`
}

type LocationUpdateResponse struct {
	VehicleID        uuid.UUID                 `json:"vehicle_id"`
	Latitude         float64                   `json:"latitude"`
	Longitude        float64                   `json:"longitude"`
	Timestamp        time.Time                 `json:"timestamp"`
	CurrentGeofences []CurrentGeofenceInfo     `json:"current_geofences"`
	Events           []DetectedTransitionEvent `json:"events"`
}

type VehicleLocationRecord struct {
	ID         uuid.UUID `json:"id" db:"id"`
	VehicleID  uuid.UUID `json:"vehicle_id" db:"vehicle_id"`
	Latitude   float64   `json:"latitude" db:"latitude"`
	Longitude  float64   `json:"longitude" db:"longitude"`
	RecordedAt time.Time `json:"recorded_at" db:"recorded_at"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

