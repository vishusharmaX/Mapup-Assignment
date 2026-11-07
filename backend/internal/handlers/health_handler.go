package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/utils"
)

type HealthHandler struct {
	pool *pgxpool.Pool
}

func NewHealthHandler(pool *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{pool: pool}
}

// GET /health
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	dbStatus := "connected"
	if err := h.pool.Ping(ctx); err != nil {
		dbStatus = "disconnected: " + err.Error()
		utils.JSON(w, r, http.StatusServiceUnavailable, map[string]any{
			"status":   "unhealthy",
			"database": dbStatus,
		})
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"status":   "healthy",
		"database": dbStatus,
		"service":  "FleetPulse API",
		"version":  "1.0.0",
	})
}
