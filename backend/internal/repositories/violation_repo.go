package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/models"
)

type ViolationRepository interface {
	CreateTx(ctx context.Context, tx pgx.Tx, v *models.Violation) error
	List(ctx context.Context, filter models.ViolationFilter) ([]models.Violation, int, error)
	GetRecent(ctx context.Context, limit int) ([]models.Violation, error)
	Count(ctx context.Context) (int, error)
	GetTopTriggeredGeofences(ctx context.Context, limit int) ([]map[string]any, error)
}

type violationRepo struct {
	pool *pgxpool.Pool
}

func NewViolationRepository(pool *pgxpool.Pool) ViolationRepository {
	return &violationRepo{pool: pool}
}

func (r *violationRepo) CreateTx(ctx context.Context, tx pgx.Tx, v *models.Violation) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	now := time.Now().UTC()
	v.CreatedAt = now

	query := `
		INSERT INTO violations (id, event_type, vehicle_id, geofence_id, alert_rule_id, latitude, longitude, timestamp, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := tx.Exec(ctx, query,
		v.ID,
		v.EventType,
		v.VehicleID,
		v.GeofenceID,
		v.AlertRuleID,
		v.Latitude,
		v.Longitude,
		v.Timestamp,
		v.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to record violation: %w", err)
	}
	return nil
}

func (r *violationRepo) List(ctx context.Context, filter models.ViolationFilter) ([]models.Violation, int, error) {
	baseWhere := " WHERE 1=1"
	var args []any
	argIdx := 1

	if filter.VehicleID != nil && *filter.VehicleID != uuid.Nil {
		baseWhere += fmt.Sprintf(" AND vio.vehicle_id = $%d", argIdx)
		args = append(args, *filter.VehicleID)
		argIdx++
	}

	if filter.GeofenceID != nil && *filter.GeofenceID != uuid.Nil {
		baseWhere += fmt.Sprintf(" AND vio.geofence_id = $%d", argIdx)
		args = append(args, *filter.GeofenceID)
		argIdx++
	}

	if filter.EventType != nil && *filter.EventType != "" {
		baseWhere += fmt.Sprintf(" AND vio.event_type = $%d", argIdx)
		args = append(args, *filter.EventType)
		argIdx++
	}

	if filter.StartDate != nil && !filter.StartDate.IsZero() {
		baseWhere += fmt.Sprintf(" AND vio.timestamp >= $%d", argIdx)
		args = append(args, *filter.StartDate)
		argIdx++
	}

	if filter.EndDate != nil && !filter.EndDate.IsZero() {
		baseWhere += fmt.Sprintf(" AND vio.timestamp <= $%d", argIdx)
		args = append(args, *filter.EndDate)
		argIdx++
	}

	countQuery := `
		SELECT COUNT(*)
		FROM violations vio
	` + baseWhere

	var totalCount int
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count violations: %w", err)
	}

	selectQuery := `
		SELECT 
			vio.id, vio.event_type, vio.vehicle_id, vio.geofence_id, vio.alert_rule_id,
			vio.latitude, vio.longitude, vio.timestamp, vio.created_at,
			v.vehicle_number, v.driver_name, v.vehicle_type,
			g.name AS geofence_name, g.category
		FROM violations vio
		JOIN vehicles v ON vio.vehicle_id = v.id
		JOIN geofences g ON vio.geofence_id = g.id
	` + baseWhere + fmt.Sprintf(" ORDER BY vio.timestamp DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)

	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}

	argsWithPaging := append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, argsWithPaging...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list violations: %w", err)
	}
	defer rows.Close()

	violations := make([]models.Violation, 0)
	for rows.Next() {
		var v models.Violation
		if err := rows.Scan(
			&v.ID,
			&v.EventType,
			&v.VehicleID,
			&v.GeofenceID,
			&v.AlertRuleID,
			&v.Latitude,
			&v.Longitude,
			&v.Timestamp,
			&v.CreatedAt,
			&v.VehicleNumber,
			&v.DriverName,
			&v.VehicleType,
			&v.GeofenceName,
			&v.Category,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan violation: %w", err)
		}
		violations = append(violations, v)
	}

	return violations, totalCount, nil
}

func (r *violationRepo) GetRecent(ctx context.Context, limit int) ([]models.Violation, error) {
	if limit <= 0 {
		limit = 10
	}
	query := `
		SELECT 
			vio.id, vio.event_type, vio.vehicle_id, vio.geofence_id, vio.alert_rule_id,
			vio.latitude, vio.longitude, vio.timestamp, vio.created_at,
			v.vehicle_number, v.driver_name, v.vehicle_type,
			g.name AS geofence_name, g.category
		FROM violations vio
		JOIN vehicles v ON vio.vehicle_id = v.id
		JOIN geofences g ON vio.geofence_id = g.id
		ORDER BY vio.timestamp DESC
		LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent violations: %w", err)
	}
	defer rows.Close()

	violations := make([]models.Violation, 0)
	for rows.Next() {
		var v models.Violation
		if err := rows.Scan(
			&v.ID,
			&v.EventType,
			&v.VehicleID,
			&v.GeofenceID,
			&v.AlertRuleID,
			&v.Latitude,
			&v.Longitude,
			&v.Timestamp,
			&v.CreatedAt,
			&v.VehicleNumber,
			&v.DriverName,
			&v.VehicleType,
			&v.GeofenceName,
			&v.Category,
		); err != nil {
			return nil, fmt.Errorf("failed to scan recent violation: %w", err)
		}
		violations = append(violations, v)
	}
	return violations, nil
}

func (r *violationRepo) Count(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM violations").Scan(&count)
	return count, err
}

func (r *violationRepo) GetTopTriggeredGeofences(ctx context.Context, limit int) ([]map[string]any, error) {
	if limit <= 0 {
		limit = 5
	}
	query := `
		SELECT g.id, g.name, g.category, COUNT(v.id) AS violation_count
		FROM violations v
		JOIN geofences g ON v.geofence_id = g.id
		GROUP BY g.id, g.name, g.category
		ORDER BY violation_count DESC
		LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query top triggered geofences: %w", err)
	}
	defer rows.Close()

	result := make([]map[string]any, 0)
	for rows.Next() {
		var id uuid.UUID
		var name, category string
		var count int
		if err := rows.Scan(&id, &name, &category, &count); err != nil {
			return nil, err
		}
		result = append(result, map[string]any{
			"geofence_id": id,
			"name":        name,
			"category":    category,
			"count":       count,
		})
	}
	return result, nil
}
