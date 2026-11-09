package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DatabaseURL  string
	CORSOrigins  []string
	Environment  string
	LogLevel     string
	DefaultLimit int
}

func Load() *Config {
	_ = godotenv.Load()

	port := getEnv("PORT", "8080")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/fleetpulse?sslmode=disable")
	env := getEnv("ENVIRONMENT", "development")
	logLevel := getEnv("LOG_LEVEL", "info")

	rawOrigins := getEnv("CORS_ALLOWED_ORIGINS", "*")
	var corsOrigins []string
	if rawOrigins == "*" {
		corsOrigins = []string{"*"}
	} else {
		for _, o := range strings.Split(rawOrigins, ",") {
			corsOrigins = append(corsOrigins, strings.TrimSpace(o))
		}
	}

	return &Config{
		Port:         port,
		DatabaseURL:  dbURL,
		CORSOrigins:  corsOrigins,
		Environment:  env,
		LogLevel:     logLevel,
		DefaultLimit: 50,
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

