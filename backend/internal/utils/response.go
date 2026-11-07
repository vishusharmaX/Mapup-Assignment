package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"fleetpulse/backend/internal/middleware"
)

func GetRequestDurationNs(ctx context.Context) string {
	if startTime, ok := ctx.Value(middleware.StartTimeKey).(time.Time); ok {
		return fmt.Sprintf("%d", time.Since(startTime).Nanoseconds())
	}
	return "0"
}

func JSON(w http.ResponseWriter, r *http.Request, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	timeNs := GetRequestDurationNs(r.Context())

	// Convert payload into a map if possible, so time_ns can be injected at root level
	var finalPayload any

	switch v := payload.(type) {
	case map[string]any:
		v["time_ns"] = timeNs
		finalPayload = v
	default:
		// Marshal to intermediate JSON and unmarshal into map[string]any
		data, err := json.Marshal(v)
		if err != nil {
			JSONError(w, r, http.StatusInternalServerError, "Failed to encode response")
			return
		}

		var obj map[string]any
		if err := json.Unmarshal(data, &obj); err == nil && obj != nil {
			obj["time_ns"] = timeNs
			finalPayload = obj
		} else {
			// In case payload was a primitive or array
			finalPayload = map[string]any{
				"data":    v,
				"time_ns": timeNs,
			}
		}
	}

	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(finalPayload)
}

func JSONError(w http.ResponseWriter, r *http.Request, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	timeNs := GetRequestDurationNs(r.Context())

	resp := map[string]any{
		"error":       message,
		"status_code": statusCode,
		"time_ns":     timeNs,
	}

	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(resp)
}

func JSONValidationError(w http.ResponseWriter, r *http.Request, message string, details any) {
	w.Header().Set("Content-Type", "application/json")
	timeNs := GetRequestDurationNs(r.Context())

	resp := map[string]any{
		"error":       message,
		"details":     details,
		"status_code": http.StatusBadRequest,
		"time_ns":     timeNs,
	}

	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(resp)
}
