package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"

	"fleetpulse/backend/internal/models"
	"fleetpulse/backend/internal/services"
	"fleetpulse/backend/internal/utils"
)

type ViolationHandler struct {
	service services.ViolationService
}

func NewViolationHandler(service services.ViolationService) *ViolationHandler {
	return &ViolationHandler{service: service}
}

// GET /violations/history
func (h *ViolationHandler) History(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	var filter models.ViolationFilter

	if vStr := q.Get("vehicle_id"); vStr != "" {
		if id, err := uuid.Parse(vStr); err == nil {
			filter.VehicleID = &id
		}
	}

	if gStr := q.Get("geofence_id"); gStr != "" {
		if id, err := uuid.Parse(gStr); err == nil {
			filter.GeofenceID = &id
		}
	}

	if eStr := q.Get("event_type"); eStr != "" {
		filter.EventType = &eStr
	}

	if sStr := q.Get("start_date"); sStr != "" {
		if t, err := time.Parse(time.RFC3339, sStr); err == nil {
			filter.StartDate = &t
		} else if t, err := time.Parse("2006-01-02", sStr); err == nil {
			filter.StartDate = &t
		}
	}

	if eStr := q.Get("end_date"); eStr != "" {
		if t, err := time.Parse(time.RFC3339, eStr); err == nil {
			filter.EndDate = &t
		} else if t, err := time.Parse("2006-01-02", eStr); err == nil {
			// Include the whole end day
			endOfDay := t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			filter.EndDate = &endOfDay
		}
	}

	limit := 50
	if lStr := q.Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}
	filter.Limit = limit

	offset := 0
	if oStr := q.Get("offset"); oStr != "" {
		if o, err := strconv.Atoi(oStr); err == nil && o >= 0 {
			offset = o
		}
	}
	filter.Offset = offset

	violations, totalCount, err := h.service.List(r.Context(), filter)
	if err != nil {
		utils.JSONError(w, r, http.StatusInternalServerError, "Failed to retrieve violations history: "+err.Error())
		return
	}

	utils.JSON(w, r, http.StatusOK, map[string]any{
		"violations":  violations,
		"data":        violations,
		"total_count": totalCount,
		"limit":       filter.Limit,
		"offset":      filter.Offset,
	})
}
