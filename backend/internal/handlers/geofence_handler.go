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

type GeofenceHandler struct {
	service services.GeofenceService
}

func NewGeofenceHandler(service services.GeofenceService) *GeofenceHandler {
	return &GeofenceHandler{service: service}
}

// POST /geofences
func (h *GeofenceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGeofenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	geofence, err := h.service.Create(r.Context(), req)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusCreated, geofence)
}

// GET /geofences and GET /geofences?category=delivery_zone
func (h *GeofenceHandler) List(w http.ResponseWriter, r *http.Request) {
	var categoryFilter *string
	cat := r.URL.Query().Get("category")
	if cat != "" {
		categoryFilter = &cat
	}

	geofences, err := h.service.List(r.Context(), categoryFilter)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to list geofences: "+err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"geofences": geofences,
		"data":      geofences,
		"count":     len(geofences),
	})
}

// GET /geofences/{id}
func (h *GeofenceHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid geofence ID format")
		return
	}

	geofence, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, err.Error())
		return
	}
	if geofence == nil {
		utils.JSONError(w, r, http.StatusNotFound, "Geofence not found")
		return
	}

	utils.JSON(w, r, http.StatusOK, geofence)
}

// PUT /geofences/{id}
func (h *GeofenceHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid geofence ID format")
		return
	}

	var req models.UpdateGeofenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	geofence, err := h.service.Update(r.Context(), id, req)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, geofence)
}

// DELETE /geofences/{id}
func (h *GeofenceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid geofence ID format")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"message": "Geofence deleted successfully",
		"id":      id,
	})
}

