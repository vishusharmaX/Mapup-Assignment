package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/utils"
)

type GeofenceService interface {
	Create(ctx context.Context, req models.CreateGeofenceRequest) (*models.Geofence, error)
	List(ctx context.Context, category *string) ([]models.Geofence, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Geofence, error)
	Update(ctx context.Context, id uuid.UUID, req models.UpdateGeofenceRequest) (*models.Geofence, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type geofenceService struct {
	repo repositories.GeofenceRepository
}

func NewGeofenceService(repo repositories.GeofenceRepository) GeofenceService {
	return &geofenceService{repo: repo}
}

func (s *geofenceService) Create(ctx context.Context, req models.CreateGeofenceRequest) (*models.Geofence, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	wkt, err := utils.CoordinatesToWKT(req.Coordinates)
	if err != nil {
		return nil, fmt.Errorf("failed to generate polygon geometry: %w", err)
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	g := &models.Geofence{
		ID:          uuid.New(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Coordinates: req.Coordinates,
		IsActive:    isActive,
	}

	if err := s.repo.Create(ctx, g, wkt); err != nil {
		return nil, err
	}

	return g, nil
}

func (s *geofenceService) List(ctx context.Context, category *string) ([]models.Geofence, error) {
	return s.repo.List(ctx, category)
}

func (s *geofenceService) GetByID(ctx context.Context, id uuid.UUID) (*models.Geofence, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *geofenceService) Update(ctx context.Context, id uuid.UUID, req models.UpdateGeofenceRequest) (*models.Geofence, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fmt.Errorf("geofence not found")
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Description != nil {
		existing.Description = *req.Description
	}
	if req.Category != nil {
		if !models.IsValidCategory(string(*req.Category)) {
			return nil, fmt.Errorf("invalid category: %s", *req.Category)
		}
		existing.Category = *req.Category
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	var wktGeom *string
	if req.Coordinates != nil {
		coords := *req.Coordinates
		// Validate coordinates
		tempReq := models.CreateGeofenceRequest{
			Name:        existing.Name,
			Category:    existing.Category,
			Coordinates: coords,
		}
		if err := tempReq.Validate(); err != nil {
			return nil, err
		}
		existing.Coordinates = tempReq.Coordinates
		wkt, err := utils.CoordinatesToWKT(tempReq.Coordinates)
		if err != nil {
			return nil, err
		}
		wktGeom = &wkt
	}

	if err := s.repo.Update(ctx, id, existing, wktGeom); err != nil {
		return nil, err
	}

	return existing, nil
}

func (s *geofenceService) Delete(ctx context.Context, id uuid.UUID) error {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("geofence not found")
	}
	return s.repo.Delete(ctx, id)
}

