package handlers

import (
	"net/http"

	"fleetpulse/backend/internal/websocket"
)

type WebSocketHandler struct {
	hub *websocket.Hub
}

func NewWebSocketHandler(hub *websocket.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

// GET /ws/alerts
func (h *WebSocketHandler) Handle(w http.ResponseWriter, r *http.Request) {
	h.hub.ServeWs(w, r)
}

