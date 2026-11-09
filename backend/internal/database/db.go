package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %w", err)
	}

	cfg.MaxConns = 20
	cfg.MinConns = 2
	cfg.MaxConnLifetime = 1 * time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute
	cfg.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	slog.Info("Connected to PostgreSQL database successfully", "db", cfg.ConnConfig.Database)
	return pool, nil
}

func RunMigrations(ctx context.Context, pool *pgxpool.Pool, migrationFilePath string) error {
	// Look for migration file
	candidates := []string{
		migrationFilePath,
		"migrations/000001_init_schema.up.sql",
		"backend/migrations/000001_init_schema.up.sql",
		"../migrations/000001_init_schema.up.sql",
	}

	var content []byte
	var foundPath string
	var err error

	for _, p := range candidates {
		if p == "" {
			continue
		}
		if data, readErr := os.ReadFile(p); readErr == nil {
			content = data
			foundPath = p
			break
		}
	}

	if content == nil {
		slog.Warn("Migration file not found in candidates, relying on existing schema", "candidates", candidates)
		return nil
	}

	slog.Info("Executing database migrations", "file", filepath.Clean(foundPath))
	_, err = pool.Exec(ctx, string(content))
	if err != nil {
		return fmt.Errorf("failed executing migration %s: %w", foundPath, err)
	}

	slog.Info("Database migrations completed successfully")
	return nil
}

