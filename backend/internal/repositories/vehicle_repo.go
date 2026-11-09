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

type VehicleRepository interface {
	Create(ctx context.Context, v *models.Vehicle) error
	List(ctx context.Context) ([]models.Vehicle, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Vehicle, error)
	GetByNumber(ctx context.Context, number string) (*models.Vehicle, error)
	Update(ctx context.Context, id uuid.UUID, v *models.Vehicle) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetLastLocation(ctx context.Context, vehicleID uuid.UUID) (*models.VehicleLocationRecord, error)
	LockVehicleForUpdate(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID) (*models.Vehicle, error)
	RecordLocationTx(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID, lat, lon float64, recordedAt time.Time) error
	UpdateVehiclePositionTx(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID, lat, lon float64, locTime time.Time, status models.VehicleStatus) error
	Count(ctx context.Context) (total int, active int, err error)
}

type vehicleRepo struct {
	pool *pgxpool.Pool
}

func NewVehicleRepository(pool *pgxpool.Pool) VehicleRepository {
	return &vehicleRepo{pool: pool}
}

func (r *vehicleRepo) Create(ctx context.Context, v *models.Vehicle) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	if v.Status == "" {
		v.Status = models.VehicleStatusOffline
	}
	now := time.Now().UTC()
	v.CreatedAt = now
	v.UpdatedAt = now

	query := `
		INSERT INTO vehicles (id, vehicle_number, driver_name, vehicle_type, phone_number, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.pool.Exec(ctx, query,
		v.ID,
		v.VehicleNumber,
		v.DriverName,
		v.VehicleType,
		v.PhoneNumber,
		v.Status,
		v.CreatedAt,
		v.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create vehicle: %w", err)
	}
	return nil
}

func (r *vehicleRepo) List(ctx context.Context) ([]models.Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone_number, status, last_latitude, last_longitude, last_location_time, created_at, updated_at
		FROM vehicles
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list vehicles: %w", err)
	}
	defer rows.Close()

	vehicles := make([]models.Vehicle, 0)
	for rows.Next() {
		var v models.Vehicle
		if err := rows.Scan(
			&v.ID,
			&v.VehicleNumber,
			&v.DriverName,
			&v.VehicleType,
			&v.PhoneNumber,
			&v.Status,
			&v.LastLatitude,
			&v.LastLongitude,
			&v.LastLocationTime,
			&v.CreatedAt,
			&v.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan vehicle: %w", err)
		}
		vehicles = append(vehicles, v)
	}
	return vehicles, nil
}

func (r *vehicleRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone_number, status, last_latitude, last_longitude, last_location_time, created_at, updated_at
		FROM vehicles
		WHERE id = $1
	`
	var v models.Vehicle
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&v.ID,
		&v.VehicleNumber,
		&v.DriverName,
		&v.VehicleType,
		&v.PhoneNumber,
		&v.Status,
		&v.LastLatitude,
		&v.LastLongitude,
		&v.LastLocationTime,
		&v.CreatedAt,
		&v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get vehicle by id: %w", err)
	}
	return &v, nil
}

func (r *vehicleRepo) GetByNumber(ctx context.Context, number string) (*models.Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone_number, status, last_latitude, last_longitude, last_location_time, created_at, updated_at
		FROM vehicles
		WHERE vehicle_number = $1
	`
	var v models.Vehicle
	err := r.pool.QueryRow(ctx, query, number).Scan(
		&v.ID,
		&v.VehicleNumber,
		&v.DriverName,
		&v.VehicleType,
		&v.PhoneNumber,
		&v.Status,
		&v.LastLatitude,
		&v.LastLongitude,
		&v.LastLocationTime,
		&v.CreatedAt,
		&v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get vehicle by number: %w", err)
	}
	return &v, nil
}

func (r *vehicleRepo) Update(ctx context.Context, id uuid.UUID, v *models.Vehicle) error {
	v.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE vehicles
		SET vehicle_number = $1, driver_name = $2, vehicle_type = $3, phone_number = $4, status = $5, updated_at = $6
		WHERE id = $7
	`
	_, err := r.pool.Exec(ctx, query, v.VehicleNumber, v.DriverName, v.VehicleType, v.PhoneNumber, v.Status, v.UpdatedAt, id)
	return err
}

func (r *vehicleRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM vehicles WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

func (r *vehicleRepo) GetLastLocation(ctx context.Context, vehicleID uuid.UUID) (*models.VehicleLocationRecord, error) {
	query := `
		SELECT id, vehicle_id, latitude, longitude, recorded_at, created_at
		FROM vehicle_locations
		WHERE vehicle_id = $1
		ORDER BY recorded_at DESC
		LIMIT 1
	`
	var loc models.VehicleLocationRecord
	err := r.pool.QueryRow(ctx, query, vehicleID).Scan(
		&loc.ID,
		&loc.VehicleID,
		&loc.Latitude,
		&loc.Longitude,
		&loc.RecordedAt,
		&loc.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get last location: %w", err)
	}
	return &loc, nil
}

func (r *vehicleRepo) LockVehicleForUpdate(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID) (*models.Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone_number, status, last_latitude, last_longitude, last_location_time, created_at, updated_at
		FROM vehicles
		WHERE id = $1
		FOR UPDATE
	`
	var v models.Vehicle
	err := tx.QueryRow(ctx, query, vehicleID).Scan(
		&v.ID,
		&v.VehicleNumber,
		&v.DriverName,
		&v.VehicleType,
		&v.PhoneNumber,
		&v.Status,
		&v.LastLatitude,
		&v.LastLongitude,
		&v.LastLocationTime,
		&v.CreatedAt,
		&v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to lock vehicle: %w", err)
	}
	return &v, nil
}

func (r *vehicleRepo) RecordLocationTx(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID, lat, lon float64, recordedAt time.Time) error {
	query := `
		INSERT INTO vehicle_locations (id, vehicle_id, latitude, longitude, geom, recorded_at, created_at)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, NOW())
	`
	// Note: ST_MakePoint($5, $6) is (lon, lat)
	_, err := tx.Exec(ctx, query, uuid.New(), vehicleID, lat, lon, lon, lat, recordedAt)
	return err
}

func (r *vehicleRepo) UpdateVehiclePositionTx(ctx context.Context, tx pgx.Tx, vehicleID uuid.UUID, lat, lon float64, locTime time.Time, status models.VehicleStatus) error {
	query := `
		UPDATE vehicles
		SET last_latitude = $1, last_longitude = $2, last_location_time = $3, status = $4, updated_at = NOW()
		WHERE id = $5
	`
	_, err := tx.Exec(ctx, query, lat, lon, locTime, status, vehicleID)
	return err
}

func (r *vehicleRepo) Count(ctx context.Context) (total int, active int, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'active')
		FROM vehicles
	`).Scan(&total, &active)
	return total, active, err
}

