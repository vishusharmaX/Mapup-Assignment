package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/services"
	"fleetpulse/backend/internal/utils"
)

type AlertHandler struct {
	service services.AlertService
}

func NewAlertHandler(service services.AlertService) *AlertHandler {
	return &AlertHandler{service: service}
}

// POST /alerts/configure
func (h *AlertHandler) Configure(w http.ResponseWriter, r *http.Request) {
	var req models.ConfigureAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	rule, err := h.service.Configure(r.Context(), req)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusCreated, rule)
}

// GET /alerts, GET /alerts?geofence_id=..., GET /alerts?vehicle_id=...
func (h *AlertHandler) List(w http.ResponseWriter, r *http.Request) {
	var geofenceID *uuid.UUID
	if gStr := r.URL.Query().Get("geofence_id"); gStr != "" {
		if id, err := uuid.Parse(gStr); err == nil {
			geofenceID = &id
		}
	}

	var vehicleID *uuid.UUID
	if vStr := r.URL.Query().Get("vehicle_id"); vStr != "" {
		if id, err := uuid.Parse(vStr); err == nil {
			vehicleID = &id
		}
	}

	rules, err := h.service.List(r.Context(), geofenceID, vehicleID)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to list alert rules: "+err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"alerts": rules,
		"data":   rules,
		"count":  len(rules),
	})
}

// DELETE /alerts/{id}
func (h *AlertHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid alert rule ID format")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"message": "Alert rule deleted successfully",
		"id":      id,
	})
}

// PUT /alerts/{id}/toggle
func (h *AlertHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid alert rule ID format")
		return
	}

	var body struct {
		IsActive bool `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.service.Toggle(r.Context(), id, body.IsActive); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"message":   "Alert rule status updated",
		"id":        id,
		"is_active": body.IsActive,
	})
}

