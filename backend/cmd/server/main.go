package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"

	"fleetpulse/backend/internal/config"
	"fleetpulse/backend/internal/database"
	"fleetpulse/backend/internal/handlers"
	"fleetpulse/backend/internal/middleware"
	"fleetpulse/backend/internal/repositories"
	"fleetpulse/backend/internal/services"
	"fleetpulse/backend/internal/websocket"
)

func main() {
	// 1. Setup structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// 2. Load configuration
	cfg := config.Load()
	slog.Info("Starting FleetPulse API Server", "env", cfg.Environment, "port", cfg.Port)

	// 3. Connect to PostgreSQL + PostGIS database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("Database connection failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Run migrations if needed
	if err := database.RunMigrations(context.Background(), pool, "migrations/000001_init_schema.up.sql"); err != nil {
		slog.Warn("Migration execution notice", "warning", err)
	}

	// 4. Initialize WebSocket Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()
	defer wsHub.Stop()

	// 5. Initialize Repositories
	geofenceRepo := repositories.NewGeofenceRepository(pool)
	vehicleRepo := repositories.NewVehicleRepository(pool)
	alertRepo := repositories.NewAlertRepository(pool)
	stateRepo := repositories.NewStateRepository(pool)
	violationRepo := repositories.NewViolationRepository(pool)

	// 6. Initialize Services
	geofenceService := services.NewGeofenceService(geofenceRepo)
	vehicleService := services.NewVehicleService(vehicleRepo)
	alertService := services.NewAlertService(alertRepo, geofenceRepo, vehicleRepo)
	violationService := services.NewViolationService(violationRepo)
	trackingService := services.NewTrackingService(
		pool,
		vehicleRepo,
		geofenceRepo,
		stateRepo,
		alertRepo,
		violationRepo,
		wsHub,
	)

	// 7. Initialize Handlers
	geofenceHandler := handlers.NewGeofenceHandler(geofenceService)
	vehicleHandler := handlers.NewVehicleHandler(vehicleService, trackingService)
	alertHandler := handlers.NewAlertHandler(alertService)
	violationHandler := handlers.NewViolationHandler(violationService)
	healthHandler := handlers.NewHealthHandler(pool)
	statsHandler := handlers.NewStatsHandler(pool, vehicleRepo, geofenceRepo, alertRepo, violationRepo)
	wsHandler := handlers.NewWebSocketHandler(wsHub)

	// 8. Setup Router
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(middleware.RequestTimer)
	r.Use(middleware.NewCORS(cfg.CORSOrigins))
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.CleanPath)
	r.Use(middleware.StructuredLogger)

	// Health Check
	r.Get("/health", healthHandler.Health)

	// Stats / Overview Dashboard API
	r.Get("/stats/overview", statsHandler.Overview)

	// WebSocket Alerts Stream
	r.Get("/ws/alerts", wsHandler.Handle)

	// Geofences API Contract
	r.Route("/geofences", func(r chi.Router) {
		r.Post("/", geofenceHandler.Create)
		r.Get("/", geofenceHandler.List)
		r.Get("/{id}", geofenceHandler.GetByID)
		r.Put("/{id}", geofenceHandler.Update)
		r.Delete("/{id}", geofenceHandler.Delete)
	})

	// Vehicles API Contract
	r.Route("/vehicles", func(r chi.Router) {
		r.Post("/", vehicleHandler.Create)
		r.Get("/", vehicleHandler.List)
		r.Post("/location", vehicleHandler.UpdateLocation)
		r.Get("/location/{vehicle_id}", vehicleHandler.GetLocation)
		r.Get("/{id}", vehicleHandler.GetByID)
		r.Put("/{id}", vehicleHandler.Update)
		r.Delete("/{id}", vehicleHandler.Delete)
	})

	// Alerts API Contract
	r.Route("/alerts", func(r chi.Router) {
		r.Post("/configure", alertHandler.Configure)
		r.Get("/", alertHandler.List)
		r.Delete("/{id}", alertHandler.Delete)
		r.Put("/{id}/toggle", alertHandler.Toggle)
	})

	// Violations History API Contract
	r.Get("/violations/history", violationHandler.History)

	// 9. Start Server with Graceful Shutdown
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("Server listening on port " + cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Server error", "error", err)
		}
	case sig := <-shutdown:
		slog.Info("Shutdown signal received", "signal", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			slog.Error("Graceful shutdown failed, forcing close", "error", err)
			_ = server.Close()
		}
	}
	slog.Info("Server stopped cleanly")
}
