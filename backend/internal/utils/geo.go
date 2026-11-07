package utils

import (
	"fmt"
	"strings"

	"fleetpulse/backend/internal/models"
)

// CoordinatesToWKT converts a slice of [latitude, longitude] coordinates to a PostGIS WKT Polygon string:
// POLYGON((lon1 lat1, lon2 lat2, ...))
// PostGIS expects (longitude latitude) order!
func CoordinatesToWKT(coords []models.Coordinate) (string, error) {
	if len(coords) < 3 {
		return "", fmt.Errorf("at least 3 coordinates are required for a polygon")
	}

	var points []string
	for _, c := range coords {
		lat := c.Latitude()
		lon := c.Longitude()
		points = append(points, fmt.Sprintf("%f %f", lon, lat))
	}

	// Ensure closure
	first := coords[0]
	last := coords[len(coords)-1]
	if first[0] != last[0] || first[1] != last[1] {
		points = append(points, fmt.Sprintf("%f %f", first.Longitude(), first.Latitude()))
	}

	return fmt.Sprintf("SRID=4326;POLYGON((%s))", strings.Join(points, ", ")), nil
}

// PointInPolygon implements Ray-Casting algorithm for point-in-polygon detection in Go
// point: [latitude, longitude]
// polygon: [ [latitude, longitude], ... ]
func PointInPolygon(point models.Coordinate, polygon []models.Coordinate) bool {
	if len(polygon) < 3 {
		return false
	}

	x := point.Longitude()
	y := point.Latitude()

	inside := false
	n := len(polygon)

	j := n - 1
	for i := 0; i < n; i++ {
		xi := polygon[i].Longitude()
		yi := polygon[i].Latitude()
		xj := polygon[j].Longitude()
		yj := polygon[j].Latitude()

		// Check if point intersects edge
		intersect := ((yi > y) != (yj > y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)
		if intersect {
			inside = !inside
		}
		j = i
	}

	return inside
}
