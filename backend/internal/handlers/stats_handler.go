package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/utils"
)

type StatsHandler struct {
	pool          *pgxpool.Pool
	vehicleRepo   repositories.VehicleRepository
	geofenceRepo  repositories.GeofenceRepository
	alertRepo     repositories.AlertRepository
	violationRepo repositories.ViolationRepository
}

func NewStatsHandler(
	pool *pgxpool.Pool,
	vehicleRepo repositories.VehicleRepository,
	geofenceRepo repositories.GeofenceRepository,
	alertRepo repositories.AlertRepository,
	violationRepo repositories.ViolationRepository,
) *StatsHandler {
	return &StatsHandler{
		pool:          pool,
		vehicleRepo:   vehicleRepo,
		geofenceRepo:  geofenceRepo,
		alertRepo:     alertRepo,
		violationRepo: violationRepo,
	}
}

// GET /stats/overview
func (h *StatsHandler) Overview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	totalVehicles, activeVehicles, err := h.vehicleRepo.Count(ctx)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to count vehicles: "+err.Error())
		return
	}

	totalGeofences, err := h.geofenceRepo.Count(ctx)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to count geofences: "+err.Error())
		return
	}

	totalAlerts, activeAlerts, err := h.alertRepo.Count(ctx)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to count alerts: "+err.Error())
		return
	}

	totalViolations, err := h.violationRepo.Count(ctx)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to count violations: "+err.Error())
		return
	}

	recentViolations, err := h.violationRepo.GetRecent(ctx, 10)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to get recent violations: "+err.Error())
		return
	}

	topGeofences, err := h.violationRepo.GetTopTriggeredGeofences(ctx, 5)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to get top geofences: "+err.Error())
		return
	}

	// Vehicle status breakdown
	var idleVehicles, offlineVehicles int
	_ = h.pool.QueryRow(ctx, `
		SELECT 
			COUNT(*) FILTER (WHERE status = 'idle'),
			COUNT(*) FILTER (WHERE status = 'offline')
		FROM vehicles
	`).Scan(&idleVehicles, &offlineVehicles)

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"total_vehicles":      totalVehicles,
		"active_vehicles":     activeVehicles,
		"idle_vehicles":       idleVehicles,
		"offline_vehicles":    offlineVehicles,
		"total_geofences":     totalGeofences,
		"total_alert_rules":   totalAlerts,
		"active_alert_rules":  activeAlerts,
		"total_violations":    totalViolations,
		"recent_events":       recentViolations,
		"frequent_geofences":  topGeofences,
	})
}

