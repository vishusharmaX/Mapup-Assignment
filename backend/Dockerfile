# Multi-stage Dockerfile for FleetPulse Go Backend
FROM golang:alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/fleetpulse-server ./cmd/server

# Build optional seed tool
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/fleetpulse-seed ./cmd/seed

# Production Minimal Stage
FROM alpine:3.20

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata curl

# Copy compiled binaries and migrations
COPY --from=builder /app/fleetpulse-server /app/fleetpulse-server
COPY --from=builder /app/fleetpulse-seed /app/fleetpulse-seed
COPY --from=builder /app/migrations /app/migrations

# Non-root user for security
RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/fleetpulse-server"]

