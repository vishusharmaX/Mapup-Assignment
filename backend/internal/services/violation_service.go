package services

import (
	"context"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/repositories"
)

type ViolationService interface {
	List(ctx context.Context, filter models.ViolationFilter) ([]models.Violation, int, error)
	GetRecent(ctx context.Context, limit int) ([]models.Violation, error)
	Count(ctx context.Context) (int, error)
}

type violationService struct {
	repo repositories.ViolationRepository
}

func NewViolationService(repo repositories.ViolationRepository) ViolationService {
	return &violationService{repo: repo}
}

func (s *violationService) List(ctx context.Context, filter models.ViolationFilter) ([]models.Violation, int, error) {
	return s.repo.List(ctx, filter)
}

func (s *violationService) GetRecent(ctx context.Context, limit int) ([]models.Violation, error) {
	return s.repo.GetRecent(ctx, limit)
}

func (s *violationService) Count(ctx context.Context) (int, error) {
	return s.repo.Count(ctx)
}

