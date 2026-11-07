package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StateRepository interface {
	GetStatesForVehicleTx(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID) (map[uuid.UUID]bool, error)
	UpsertStateTx(ctx context.Context, tx pgx.Tx, vehicleID, geofenceID uuid.UUID, isInside bool, transition string) error
	ClearVehicleStates(ctx context.Context, vehicleID uuid.UUID) error
}

type stateRepo struct {
	pool *pgxpool.Pool
}

func NewStateRepository(pool *pgxpool.Pool) StateRepository {
	return &stateRepo{pool: pool}
}

func (r *stateRepo) GetStatesForVehicleTx(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID) (map[uuid.UUID]bool, error) {
	query := `
		SELECT geofence_id, is_inside
		FROM vehicle_geofence_states
		WHERE vehicle_id = $1
	`
	rows, err := tx.Query(ctx, query, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("failed to query vehicle geofence states: %w", err)
	}
	defer rows.Close()

	states := make(map[uuid.UUID]bool)
	for rows.Next() {
		var gID uuid.UUID
		var isInside bool
		if err := rows.Scan(&gID, &isInside); err != nil {
			return nil, fmt.Errorf("failed to scan geofence state: %w", err)
		}
		states[gID] = isInside
	}
	return states, nil
}

func (r *stateRepo) UpsertStateTx(ctx context.Context, tx pgx.Tx, vehicleID, geofenceID uuid.UUID, isInside bool, transition string) error {
	query := `
		INSERT INTO vehicle_geofence_states (id, vehicle_id, geofence_id, is_inside, last_transition, last_updated)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (vehicle_id, geofence_id)
		DO UPDATE SET 
			is_inside = EXCLUDED.is_inside,
			last_transition = EXCLUDED.last_transition,
			last_updated = NOW()
	`
	_, err := tx.Exec(ctx, query, uuid.New(), vehicleID, geofenceID, isInside, transition)
	if err != nil {
		return fmt.Errorf("failed to upsert vehicle geofence state: %w", err)
	}
	return nil
}

func (r *stateRepo) ClearVehicleStates(ctx context.Context, vehicleID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM vehicle_geofence_states WHERE vehicle_id = $1`, vehicleID)
	return err
}
