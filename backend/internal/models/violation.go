package models

import (
	"time"

	"github.com/google/uuid"
)

type Violation struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	EventType     string     `json:"event_type" db:"event_type"`
	VehicleID     uuid.UUID  `json:"vehicle_id" db:"vehicle_id"`
	GeofenceID    uuid.UUID  `json:"geofence_id" db:"geofence_id"`
	AlertRuleID   *uuid.UUID `json:"alert_rule_id,omitempty" db:"alert_rule_id"`
	Latitude      float64    `json:"latitude" db:"latitude"`
	Longitude     float64    `json:"longitude" db:"longitude"`
	Timestamp     time.Time  `json:"timestamp" db:"timestamp"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`

	// Joined details for frontend display
	VehicleNumber string     `json:"vehicle_number,omitempty" db:"vehicle_number"`
	DriverName    string     `json:"driver_name,omitempty" db:"driver_name"`
	VehicleType   string     `json:"vehicle_type,omitempty" db:"vehicle_type"`
	GeofenceName  string     `json:"geofence_name,omitempty" db:"geofence_name"`
	Category      string     `json:"category,omitempty" db:"category"`
}

type ViolationFilter struct {
	VehicleID  *uuid.UUID
	GeofenceID *uuid.UUID
	EventType  *string
	StartDate  *time.Time
	EndDate    *time.Time
	Limit      int
	Offset     int
}

type WebSocketAlertEvent struct {
	EventID   string         `json:"event_id"`
	EventType string         `json:"event_type"`
	Timestamp string         `json:"timestamp"`
	Vehicle   WSVehicleInfo  `json:"vehicle"`
	Geofence  WSGeofenceInfo `json:"geofence"`
	Location  WSLocationInfo `json:"location"`
}

type WSVehicleInfo struct {
	VehicleID     string `json:"vehicle_id"`
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
}

type WSGeofenceInfo struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category"`
}

type WSLocationInfo struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

