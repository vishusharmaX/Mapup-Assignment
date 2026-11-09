package repositories

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/models"
)

type AlertRepository interface {
	Create(ctx context.Context, rule *models.AlertRule) error
	List(ctx context.Context, geofenceID, vehicleID *uuid.UUID) ([]models.AlertRule, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.AlertRule, error)
	Delete(ctx context.Context, id uuid.UUID) error
	ToggleActive(ctx context.Context, id uuid.UUID, isActive bool) error
	FindMatchingRulesTx(ctx context.Context, tx pgx.Tx, geofenceID, vehicleID uuid.UUID, transition string) ([]models.AlertRule, error)
	Count(ctx context.Context) (total int, active int, err error)
}

type alertRepo struct {
	pool *pgxpool.Pool
}

func NewAlertRepository(pool *pgxpool.Pool) AlertRepository {
	return &alertRepo{pool: pool}
}

func (r *alertRepo) Create(ctx context.Context, rule *models.AlertRule) error {
	if rule.ID == uuid.Nil {
		rule.ID = uuid.New()
	}
	now := time.Now().UTC()
	rule.CreatedAt = now
	rule.UpdatedAt = now

	query := `
		INSERT INTO alert_rules (id, geofence_id, vehicle_id, event_type, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query,
		rule.ID,
		rule.GeofenceID,
		rule.VehicleID,
		rule.EventType,
		rule.IsActive,
		rule.CreatedAt,
		rule.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create alert rule: %w", err)
	}
	return nil
}

func (r *alertRepo) List(ctx context.Context, geofenceID, vehicleID *uuid.UUID) ([]models.AlertRule, error) {
	query := `
		SELECT 
			ar.id, ar.geofence_id, ar.vehicle_id, ar.event_type, ar.is_active, ar.created_at, ar.updated_at,
			g.name AS geofence_name, g.category,
			v.vehicle_number
		FROM alert_rules ar
		JOIN geofences g ON ar.geofence_id = g.id
		LEFT JOIN vehicles v ON ar.vehicle_id = v.id
		WHERE 1=1
	`
	var args []any
	argIdx := 1

	if geofenceID != nil && *geofenceID != uuid.Nil {
		query += fmt.Sprintf(" AND ar.geofence_id = $%d", argIdx)
		args = append(args, *geofenceID)
		argIdx++
	}

	if vehicleID != nil && *vehicleID != uuid.Nil {
		query += fmt.Sprintf(" AND ar.vehicle_id = $%d", argIdx)
		args = append(args, *vehicleID)
		argIdx++
	}

	query += " ORDER BY ar.created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list alert rules: %w", err)
	}
	defer rows.Close()

	rules := make([]models.AlertRule, 0)
	for rows.Next() {
		var rule models.AlertRule
		if err := rows.Scan(
			&rule.ID,
			&rule.GeofenceID,
			&rule.VehicleID,
			&rule.EventType,
			&rule.IsActive,
			&rule.CreatedAt,
			&rule.UpdatedAt,
			&rule.GeofenceName,
			&rule.Category,
			&rule.VehicleNumber,
		); err != nil {
			return nil, fmt.Errorf("failed to scan alert rule: %w", err)
		}
		rules = append(rules, rule)
	}
	return rules, nil
}

func (r *alertRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.AlertRule, error) {
	query := `
		SELECT 
			ar.id, ar.geofence_id, ar.vehicle_id, ar.event_type, ar.is_active, ar.created_at, ar.updated_at,
			g.name AS geofence_name, g.category,
			v.vehicle_number
		FROM alert_rules ar
		JOIN geofences g ON ar.geofence_id = g.id
		LEFT JOIN vehicles v ON ar.vehicle_id = v.id
		WHERE ar.id = $1
	`
	var rule models.AlertRule
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&rule.ID,
		&rule.GeofenceID,
		&rule.VehicleID,
		&rule.EventType,
		&rule.IsActive,
		&rule.CreatedAt,
		&rule.UpdatedAt,
		&rule.GeofenceName,
		&rule.Category,
		&rule.VehicleNumber,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get alert rule: %w", err)
	}
	return &rule, nil
}

func (r *alertRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM alert_rules WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *alertRepo) ToggleActive(ctx context.Context, id uuid.UUID, isActive bool) error {
	query := `UPDATE alert_rules SET is_active = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, isActive, id)
	return err
}

func (r *alertRepo) FindMatchingRulesTx(ctx context.Context, tx pgx.Tx, geofenceID, vehicleID uuid.UUID, transition string) ([]models.AlertRule, error) {
	query := `
		SELECT 
			ar.id, ar.geofence_id, ar.vehicle_id, ar.event_type, ar.is_active, ar.created_at, ar.updated_at,
			g.name AS geofence_name, g.category
		FROM alert_rules ar
		JOIN geofences g ON ar.geofence_id = g.id
		WHERE ar.geofence_id = $1
		  AND ar.is_active = true
		  AND (ar.vehicle_id IS NULL OR ar.vehicle_id = $2)
		  AND (ar.event_type = 'both' OR ar.event_type = $3)
	`
	rows, err := tx.Query(ctx, query, geofenceID, vehicleID, transition)
	if err != nil {
		return nil, fmt.Errorf("failed to query matching rules: %w", err)
	}
	defer rows.Close()

	var matched []models.AlertRule
	for rows.Next() {
		var rule models.AlertRule
		if err := rows.Scan(
			&rule.ID,
			&rule.GeofenceID,
			&rule.VehicleID,
			&rule.EventType,
			&rule.IsActive,
			&rule.CreatedAt,
			&rule.UpdatedAt,
			&rule.GeofenceName,
			&rule.Category,
		); err != nil {
			return nil, fmt.Errorf("failed to scan matching rule: %w", err)
		}
		matched = append(matched, rule)
	}
	return matched, nil
}

func (r *alertRepo) Count(ctx context.Context) (total int, active int, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE is_active = true)
		FROM alert_rules
	`).Scan(&total, &active)
	return total, active, err
}

