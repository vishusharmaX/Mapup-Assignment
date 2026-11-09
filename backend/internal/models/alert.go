package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type AlertEventType string

const (
	AlertEventEntry AlertEventType = "entry"
	AlertEventExit  AlertEventType = "exit"
	AlertEventBoth  AlertEventType = "both"
)

func IsValidAlertEventType(e string) bool {
	switch AlertEventType(e) {
	case AlertEventEntry, AlertEventExit, AlertEventBoth:
		return true
	default:
		return false
	}
}

type AlertRule struct {
	ID            uuid.UUID      `json:"id" db:"id"`
	GeofenceID    uuid.UUID      `json:"geofence_id" db:"geofence_id"`
	VehicleID     *uuid.UUID     `json:"vehicle_id,omitempty" db:"vehicle_id"`
	EventType     AlertEventType `json:"event_type" db:"event_type"`
	IsActive      bool           `json:"is_active" db:"is_active"`
	CreatedAt     time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at" db:"updated_at"`

	// Joined fields for display
	GeofenceName  string         `json:"geofence_name,omitempty" db:"geofence_name"`
	Category      string         `json:"category,omitempty" db:"category"`
	VehicleNumber *string        `json:"vehicle_number,omitempty" db:"vehicle_number"`
}

type ConfigureAlertRequest struct {
	GeofenceID uuid.UUID      `json:"geofence_id"`
	VehicleID  *uuid.UUID     `json:"vehicle_id,omitempty"`
	EventType  AlertEventType `json:"event_type"`
	IsActive   *bool          `json:"is_active,omitempty"`
}

func (r *ConfigureAlertRequest) Validate() error {
	if r.GeofenceID == uuid.Nil {
		return fmt.Errorf("geofence_id is required")
	}
	if !IsValidAlertEventType(string(r.EventType)) {
		return fmt.Errorf("invalid event_type '%s': must be entry, exit, or both", r.EventType)
	}
	return nil
}

