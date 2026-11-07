package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
)

type VehicleService interface {
	Create(ctx context.Context, req models.CreateVehicleRequest) (*models.Vehicle, error)
	List(ctx context.Context) ([]models.Vehicle, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Vehicle, error)
	Update(ctx context.Context, id uuid.UUID, req models.UpdateVehicleRequest) (*models.Vehicle, error)
	Delete(ctx context.Context, id uuid.UUID) error
	GetLastLocation(ctx context.Context, vehicleID uuid.UUID) (*models.VehicleLocationRecord, error)
}

type vehicleService struct {
	repo repositories.VehicleRepository
}

func NewVehicleService(repo repositories.VehicleRepository) VehicleService {
	return &vehicleService{repo: repo}
}

func (s *vehicleService) Create(ctx context.Context, req models.CreateVehicleRequest) (*models.Vehicle, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByNumber(ctx, req.VehicleNumber)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("vehicle with number '%s' already exists", req.VehicleNumber)
	}

	v := &models.Vehicle{
		ID:            uuid.New(),
		VehicleNumber: req.VehicleNumber,
		DriverName:    req.DriverName,
		VehicleType:   req.VehicleType,
		PhoneNumber:   req.PhoneNumber,
		Status:        models.VehicleStatusOffline,
	}

	if err := s.repo.Create(ctx, v); err != nil {
		return nil, err
	}

	return v, nil
}

func (s *vehicleService) List(ctx context.Context) ([]models.Vehicle, error) {
	return s.repo.List(ctx)
}

func (s *vehicleService) GetByID(ctx context.Context, id uuid.UUID) (*models.Vehicle, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *vehicleService) Update(ctx context.Context, id uuid.UUID, req models.UpdateVehicleRequest) (*models.Vehicle, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fmt.Errorf("vehicle not found")
	}

	if req.VehicleNumber != nil && *req.VehicleNumber != "" {
		if *req.VehicleNumber != existing.VehicleNumber {
			byNum, err := s.repo.GetByNumber(ctx, *req.VehicleNumber)
			if err != nil {
				return nil, err
			}
			if byNum != nil {
				return nil, fmt.Errorf("vehicle number '%s' is already in use", *req.VehicleNumber)
			}
		}
		existing.VehicleNumber = *req.VehicleNumber
	}
	if req.DriverName != nil && *req.DriverName != "" {
		existing.DriverName = *req.DriverName
	}
	if req.VehicleType != nil {
		if !models.IsValidVehicleType(string(*req.VehicleType)) {
			return nil, fmt.Errorf("invalid vehicle type: %s", *req.VehicleType)
		}
		existing.VehicleType = *req.VehicleType
	}
	if req.PhoneNumber != nil && *req.PhoneNumber != "" {
		existing.PhoneNumber = *req.PhoneNumber
	}
	if req.Status != nil {
		existing.Status = *req.Status
	}

	if err := s.repo.Update(ctx, id, existing); err != nil {
		return nil, err
	}

	return existing, nil
}

func (s *vehicleService) Delete(ctx context.Context, id uuid.UUID) error {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("vehicle not found")
	}
	return s.repo.Delete(ctx, id)
}

func (s *vehicleService) GetLastLocation(ctx context.Context, vehicleID uuid.UUID) (*models.VehicleLocationRecord, error) {
	vehicle, err := s.repo.GetByID(ctx, vehicleID)
	if err != nil {
		return nil, err
	}
	if vehicle == nil {
		return nil, fmt.Errorf("vehicle not found")
	}
	return s.repo.GetLastLocation(ctx, vehicleID)
}
