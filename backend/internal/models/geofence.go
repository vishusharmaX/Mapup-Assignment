package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Coordinate [2]float64 // [latitude, longitude]

func (c Coordinate) Latitude() float64  { return c[0] }
func (c Coordinate) Longitude() float64 { return c[1] }

type GeofenceCategory string

const (
	CategoryDeliveryZone   GeofenceCategory = "delivery_zone"
	CategoryRestrictedZone GeofenceCategory = "restricted_zone"
	CategoryTollZone       GeofenceCategory = "toll_zone"
	CategoryCustomerArea   GeofenceCategory = "customer_area"
)

func IsValidCategory(c string) bool {
	switch GeofenceCategory(c) {
	case CategoryDeliveryZone, CategoryRestrictedZone, CategoryTollZone, CategoryCustomerArea:
		return true
	default:
		return false
	}
}

type Geofence struct {
	ID          uuid.UUID        `json:"id" db:"id"`
	Name        string           `json:"name" db:"name"`
	Description string           `json:"description" db:"description"`
	Category    GeofenceCategory `json:"category" db:"category"`
	Coordinates []Coordinate     `json:"coordinates" db:"coordinates"`
	IsActive    bool             `json:"is_active" db:"is_active"`
	CreatedAt   time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at" db:"updated_at"`
}

type CreateGeofenceRequest struct {
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Category    GeofenceCategory `json:"category"`
	Coordinates []Coordinate     `json:"coordinates"`
	IsActive    *bool            `json:"is_active,omitempty"`
}

func (r *CreateGeofenceRequest) Validate() error {
	if r.Name == "" {
		return fmt.Errorf("name is required")
	}
	if !IsValidCategory(string(r.Category)) {
		return fmt.Errorf("invalid category '%s': must be one of delivery_zone, restricted_zone, toll_zone, customer_area", r.Category)
	}
	if len(r.Coordinates) < 3 {
		return fmt.Errorf("polygon requires at least 3 coordinates")
	}

	for i, coord := range r.Coordinates {
		lat, lon := coord.Latitude(), coord.Longitude()
		if lat < -90 || lat > 90 {
			return fmt.Errorf("coordinate at index %d has invalid latitude %f (must be between -90 and 90)", i, lat)
		}
		if lon < -180 || lon > 180 {
			return fmt.Errorf("coordinate at index %d has invalid longitude %f (must be between -180 and 180)", i, lon)
		}
	}

	// Auto-close if needed
	first := r.Coordinates[0]
	last := r.Coordinates[len(r.Coordinates)-1]
	if first[0] != last[0] || first[1] != last[1] {
		r.Coordinates = append(r.Coordinates, first)
	}

	if len(r.Coordinates) < 4 {
		return fmt.Errorf("polygon must have at least 3 distinct vertices (4 points closed)")
	}

	return nil
}

type UpdateGeofenceRequest struct {
	Name        *string           `json:"name,omitempty"`
	Description *string           `json:"description,omitempty"`
	Category    *GeofenceCategory `json:"category,omitempty"`
	Coordinates *[]Coordinate     `json:"coordinates,omitempty"`
	IsActive    *bool             `json:"is_active,omitempty"`
}
