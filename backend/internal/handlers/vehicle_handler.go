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

type VehicleHandler struct {
	vehicleService  services.VehicleService
	trackingService services.TrackingService
}

func NewVehicleHandler(vehicleService services.VehicleService, trackingService services.TrackingService) *VehicleHandler {
	return &VehicleHandler{
		vehicleService:  vehicleService,
		trackingService: trackingService,
	}
}

// POST /vehicles
func (h *VehicleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	vehicle, err := h.vehicleService.Create(r.Context(), req)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusCreated, vehicle)
}

// GET /vehicles
func (h *VehicleHandler) List(w http.ResponseWriter, r *http.Request) {
	vehicles, err := h.vehicleService.List(r.Context())
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to list vehicles: "+err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"vehicles": vehicles,
		"data":     vehicles,
		"count":    len(vehicles),
	})
}

// GET /vehicles/{id}
func (h *VehicleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid vehicle ID format")
		return
	}

	vehicle, err := h.vehicleService.GetByID(r.Context(), id)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, err.Error())
		return
	}
	if vehicle == nil {
		utils.JSONError(w, r, http.StatusNotFound, "Vehicle not found")
		return
	}

	utils.JSON(w, r, http.StatusOK, vehicle)
}

// PUT /vehicles/{id}
func (h *VehicleHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid vehicle ID format")
		return
	}

	var req models.UpdateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	vehicle, err := h.vehicleService.Update(r.Context(), id, req)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, vehicle)
}

// DELETE /vehicles/{id}
func (h *VehicleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid vehicle ID format")
		return
	}

	if err := h.vehicleService.Delete(r.Context(), id); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"message": "Vehicle deleted successfully",
		"id":      id,
	})
}

// POST /vehicles/location
func (h *VehicleHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	var req models.LocationUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid location update payload: "+err.Error())
		return
	}

	resp, err := h.trackingService.ProcessLocation(r.Context(), req)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, resp)
}

// GET /vehicles/location/{vehicle_id}
func (h *VehicleHandler) GetLocation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "vehicle_id")
	vehicleID, err := uuid.Parse(idStr)
	if err != nil {
		utils.JSONError(w, r, http.StatusBadRequest, "Invalid vehicle ID format")
		return
	}

	loc, err := h.vehicleService.GetLastLocation(r.Context(), vehicleID)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, err.Error())
		return
	}
	if loc == nil {
		utils.JSONError(w, r, http.StatusNotFound, "No location history found for vehicle")
		return
	}

	utils.JSON(w, r, http.StatusOK, loc)
}

