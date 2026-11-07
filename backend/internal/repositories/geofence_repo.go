package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/models"
)

type GeofenceRepository interface {
	Create(ctx context.Context, g *models.Geofence, wktGeom string) error
	List(ctx context.Context, category *string) ([]models.Geofence, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Geofence, error)
	Update(ctx context.Context, id uuid.UUID, g *models.Geofence, wktGeom *string) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindCoveringGeofences(ctx context.Context, longitude, latitude float64) ([]models.Geofence, error)
	Count(ctx context.Context) (int, error)
}

type geofenceRepo struct {
	pool *pgxpool.Pool
}

func NewGeofenceRepository(pool *pgxpool.Pool) GeofenceRepository {
	return &geofenceRepo{pool: pool}
}

func (r *geofenceRepo) Create(ctx context.Context, g *models.Geofence, wktGeom string) error {
	coordsJSON, err := json.Marshal(g.Coordinates)
	if err != nil {
		return fmt.Errorf("failed to marshal coordinates: %w", err)
	}

	query := `
		INSERT INTO geofences (id, name, description, category, coordinates, geom, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), $7, $8, $9)
	`

	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	now := time.Now().UTC()
	g.CreatedAt = now
	g.UpdatedAt = now

	_, err = r.pool.Exec(ctx, query,
		g.ID,
		g.Name,
		g.Description,
		g.Category,
		coordsJSON,
		wktGeom,
		g.IsActive,
		g.CreatedAt,
		g.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert geofence: %w", err)
	}
	return nil
}

func (r *geofenceRepo) List(ctx context.Context, category *string) ([]models.Geofence, error) {
	var query string
	var args []any

	if category != nil && *category != "" {
		query = `
			SELECT id, name, description, category, coordinates, is_active, created_at, updated_at
			FROM geofences
			WHERE category = $1
			ORDER BY created_at DESC
		`
		args = append(args, *category)
	} else {
		query = `
			SELECT id, name, description, category, coordinates, is_active, created_at, updated_at
			FROM geofences
			ORDER BY created_at DESC
		`
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query geofences: %w", err)
	}
	defer rows.Close()

	geofences := make([]models.Geofence, 0)
	for rows.Next() {
		var g models.Geofence
		var coordsRaw []byte
		if err := rows.Scan(
			&g.ID,
			&g.Name,
			&g.Description,
			&g.Category,
			&coordsRaw,
			&g.IsActive,
			&g.CreatedAt,
			&g.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan geofence: %w", err)
		}

		if err := json.Unmarshal(coordsRaw, &g.Coordinates); err != nil {
			return nil, fmt.Errorf("failed to unmarshal coordinates for geofence %s: %w", g.ID, err)
		}
		geofences = append(geofences, g)
	}

	return geofences, nil
}

func (r *geofenceRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Geofence, error) {
	query := `
		SELECT id, name, description, category, coordinates, is_active, created_at, updated_at
		FROM geofences
		WHERE id = $1
	`

	var g models.Geofence
	var coordsRaw []byte
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&g.ID,
		&g.Name,
		&g.Description,
		&g.Category,
		&coordsRaw,
		&g.IsActive,
		&g.CreatedAt,
		&g.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get geofence by id: %w", err)
	}

	if err := json.Unmarshal(coordsRaw, &g.Coordinates); err != nil {
		return nil, fmt.Errorf("failed to unmarshal coordinates: %w", err)
	}

	return &g, nil
}

func (r *geofenceRepo) Update(ctx context.Context, id uuid.UUID, g *models.Geofence, wktGeom *string) error {
	now := time.Now().UTC()
	g.UpdatedAt = now

	if wktGeom != nil && *wktGeom != "" {
		coordsJSON, err := json.Marshal(g.Coordinates)
		if err != nil {
			return fmt.Errorf("failed to marshal coordinates: %w", err)
		}

		query := `
			UPDATE geofences
			SET name = $1, description = $2, category = $3, coordinates = $4, geom = ST_GeomFromText($5, 4326), is_active = $6, updated_at = $7
			WHERE id = $8
		`
		_, err = r.pool.Exec(ctx, query, g.Name, g.Description, g.Category, coordsJSON, *wktGeom, g.IsActive, g.UpdatedAt, id)
		return err
	}

	query := `
		UPDATE geofences
		SET name = $1, description = $2, category = $3, is_active = $4, updated_at = $5
		WHERE id = $6
	`
	_, err := r.pool.Exec(ctx, query, g.Name, g.Description, g.Category, g.IsActive, g.UpdatedAt, id)
	return err
}

func (r *geofenceRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM geofences WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *geofenceRepo) FindCoveringGeofences(ctx context.Context, longitude, latitude float64) ([]models.Geofence, error) {
	// Notice coordinate order for ST_MakePoint is (longitude, latitude)
	query := `
		SELECT id, name, description, category, coordinates, is_active, created_at, updated_at
		FROM geofences
		WHERE is_active = true
		  AND ST_Covers(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
		ORDER BY name ASC
	`

	rows, err := r.pool.Query(ctx, query, longitude, latitude)
	if err != nil {
		return nil, fmt.Errorf("failed to find covering geofences: %w", err)
	}
	defer rows.Close()

	var covering []models.Geofence
	for rows.Next() {
		var g models.Geofence
		var coordsRaw []byte
		if err := rows.Scan(
			&g.ID,
			&g.Name,
			&g.Description,
			&g.Category,
			&coordsRaw,
			&g.IsActive,
			&g.CreatedAt,
			&g.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan covering geofence: %w", err)
		}
		if err := json.Unmarshal(coordsRaw, &g.Coordinates); err != nil {
			return nil, fmt.Errorf("failed to unmarshal coordinates: %w", err)
		}
		covering = append(covering, g)
	}
	return covering, nil
}

func (r *geofenceRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM geofences").Scan(&count)
	return count, err
}
