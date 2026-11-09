# FleetPulse — System Setup & Architecture Documentation

## 1. Project Overview & Product Vision

**FleetPulse** is a production-grade, enterprise SaaS platform engineered for real-time fleet intelligence, polygon-based geospatial boundary enforcement, and sub-millisecond violation detection.

Built with a high-concurrency **Go (Golang)** backend and a reactive **React + TypeScript + Vite + Leaflet** frontend, the platform monitors vehicles, registers geographic boundaries (SRID 4326), processes live GPS telemetry, detects boundary transitions (`entry` and `exit`), triggers configurable alert rules, and broadcasts events in real-time over WebSockets.

---

## 2. Technology Stack

### Backend
- **Language**: Go (Golang) 1.22+
- **HTTP Router**: Chi (`github.com/go-chi/chi/v5`)
- **Database**: PostgreSQL 16 with PostGIS 3.4 Spatial Extension
- **Database Driver**: pgxpool (`github.com/jackc/pgx/v5`)
- **Real-Time Communication**: Gorilla WebSocket (`github.com/gorilla/websocket`)
- **Structured Logging**: Standard Go `log/slog`
- **Testing**: Standard Go `testing` framework with race condition detector (`-race`)

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6+ & `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4, Lucide React icons, Radix UI primitives
- **Geospatial Mapping**: Leaflet, React-Leaflet, Leaflet-Draw, OpenStreetMap tiles
- **State & Telemetry**: TanStack React Query v5, Axios
- **Notifications**: Sonner toast notification system
- **Testing**: Vitest & Testing Library

### Infrastructure & Deployment
- **Containerization**: Docker multi-stage builds (`backend/Dockerfile`, `frontend/Dockerfile`)
- **Orchestration**: Docker Compose (`docker-compose.yml`)
- **Spatial Reference System**: WGS 84 / EPSG:4326

---

## 3. Prerequisites

Before installing, ensure the following are installed on your host machine:

- **Go**: `1.22` or higher ([https://golang.org/dl](https://golang.org/dl))
- **Node.js**: `v20.x` or higher and `npm` `10.x`+ ([https://nodejs.org](https://nodejs.org))
- **PostgreSQL + PostGIS**: PostgreSQL 15+ with PostGIS extension enabled, **OR** Docker & Docker Compose
- **Docker & Docker Compose**: (Recommended for zero-dependency containerized startup)

---

## 4. Environment Configuration

Copy the example environment configuration into both project root and backend:

```bash
# In project root
cp .env.example .env

# In backend directory
cp .env.example backend/.env
```

### Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend HTTP API and WebSocket listening port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/fleetpulse?sslmode=disable` |
| `ENVIRONMENT` | Runtime environment (`development`, `production`) | `development` |
| `LOG_LEVEL` | Log verbosity (`debug`, `info`, `warn`, `error`) | `info` |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins | `*` or `http://localhost:5173,http://localhost:3000` |
| `VITE_API_URL` | Backend URL accessed by React frontend | `http://localhost:8080` |
| `VITE_WS_URL` | WebSocket URL for real-time alert feed | `ws://localhost:8080/ws/alerts` |

---

## 5. Quick Start with Docker Compose (Recommended)

Start the entire platform (PostgreSQL + PostGIS + Go Backend + React Frontend) with one command:

```bash
docker compose up --build
```

Services will initialize in the correct dependency order:
1. **fleetpulse-postgres**: PostgreSQL 16 + PostGIS boots up and passes health check.
2. **fleetpulse-backend**: Automatically runs database migrations, initializes WebSocket hub, and listens on port `8080`.
3. **fleetpulse-frontend**: Serves optimized production build on port `3000` (and `5173`).

Open your browser to:
- **Web Application Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

---

## 6. Local Development Setup (Manual)

### Step 1: Database Setup
Ensure PostgreSQL is running with the PostGIS extension installed:
```sql
CREATE DATABASE fleetpulse;
\c fleetpulse;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
```

Apply migrations:
```bash
# From project root
psql -U postgres -d fleetpulse -f backend/migrations/000001_init_schema.up.sql
```

### Step 2: Seed Sample Fleet Data
Populate the database with realistic demonstration vehicles, geofences, and alert rules:
```bash
cd backend
go run ./cmd/seed
```

### Step 3: Run the Go Backend
```bash
cd backend
go run ./cmd/server
```
The server will start on port `8080` (or `PORT` specified in `.env`).

### Step 4: Run the React Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Access the application at [http://localhost:5173](http://localhost:5173).

---

## 7. Complete API Reference

Every single HTTP response returns `"time_ns": "<execution_time_in_nanoseconds>"`.

### A. Health Check
- **`GET /health`**
  - **Description**: Verifies service status and database connectivity.
  - **Sample Response (200 OK)**:
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "service": "FleetPulse API",
      "version": "1.0.0",
      "time_ns": "1062500"
    }
    ```

### B. Geofences API
- **`GET /geofences`**
  - **Optional Query Params**: `category=delivery_zone` (`delivery_zone`, `restricted_zone`, `toll_zone`, `customer_area`)
  - **Sample Response (200 OK)**:
    ```json
    {
      "geofences": [
        {
          "id": "51d0116d-c698-4126-b516-7c1bc6667bb9",
          "name": "Presidio Security Restricted Enclave",
          "description": "Strict military and federal restricted sector.",
          "category": "restricted_zone",
          "coordinates": [
            [37.8020, -122.4720],
            [37.8050, -122.4550],
            [37.7940, -122.4540],
            [37.7920, -122.4700],
            [37.8020, -122.4720]
          ],
          "is_active": true,
          "created_at": "2026-11-07T07:03:47Z",
          "updated_at": "2026-11-07T07:03:47Z"
        }
      ],
      "count": 1,
      "time_ns": "5940200"
    }
    ```

- **`POST /geofences`**
  - **Description**: Creates a new polygon geofence. Automatically validates coordinate bounds and enforces polygon closure.
  - **Request Body**:
    ```json
    {
      "name": "Downtown Commercial Delivery Zone",
      "description": "Union Square commercial freight zone",
      "category": "delivery_zone",
      "coordinates": [
        [37.7890, -122.4120],
        [37.7920, -122.4040],
        [37.7850, -122.4000],
        [37.7820, -122.4090],
        [37.7890, -122.4120]
      ]
    }
    ```
  - **Response (201 Created)**:
    ```json
    {
      "id": "8a1a547c-baf7-4bb0-a317-c02f3a15fc89",
      "name": "Downtown Commercial Delivery Zone",
      "category": "delivery_zone",
      "coordinates": [[37.7890, -122.4120], ...],
      "is_active": true,
      "time_ns": "114345800"
    }
    ```

- **`DELETE /geofences/{id}`**
  - **Response (200 OK)**: `{"message": "Geofence deleted successfully", "id": "...", "time_ns": "..."}`

---

### C. Vehicles API
- **`GET /vehicles`**
  - **Description**: Lists all registered fleet vehicles with last known location and operational status.
  - **Response (200 OK)**:
    ```json
    {
      "vehicles": [
        {
          "id": "55ba5a10-3d61-4d87-8234-70844764103f",
          "vehicle_number": "KA-01-AB-1234",
          "driver_name": "John Doe",
          "vehicle_type": "truck",
          "phone_number": "+1 (555) 234-5678",
          "status": "active",
          "last_latitude": 37.7890,
          "last_longitude": -122.4120,
          "last_location_time": "2026-11-07T07:24:57Z"
        }
      ],
      "count": 1,
      "time_ns": "5774900"
    }
    ```

- **`POST /vehicles`**
  - **Description**: Registers a new vehicle asset.
  - **Request Body**:
    ```json
    {
      "vehicle_number": "KA-01-AB-1234",
      "driver_name": "John Doe",
      "vehicle_type": "truck",
      "phone_number": "+1 (555) 234-5678"
    }
    ```
  - **Response (201 Created)**: Returns created vehicle with `"status": "offline"` and `"time_ns": "..."`.

- **`POST /vehicles/location` (Core Geospatial Processing Endpoint)**
  - **Description**: Submits a GPS telemetry ping. Evaluates spatial point-in-polygon containment against active geofences, detects state transitions (`entry` or `exit`), triggers alert rules, persists violations, and broadcasts real-time WebSocket notifications.
  - **Request Body**:
    ```json
    {
      "vehicle_id": "55ba5a10-3d61-4d87-8234-70844764103f",
      "latitude": 37.8000,
      "longitude": -122.4600,
      "timestamp": "2026-11-07T07:24:57Z"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "vehicle_id": "55ba5a10-3d61-4d87-8234-70844764103f",
      "latitude": 37.8,
      "longitude": -122.46,
      "timestamp": "2026-11-07T07:24:57Z",
      "current_geofences": [
        {
          "geofence_id": "51d0116d-c698-4126-b516-7c1bc6667bb9",
          "name": "Presidio Security Restricted Enclave",
          "category": "restricted_zone"
        }
      ],
      "events": [
        {
          "event_id": "01d7b05f-548f-46ed-9cee-2568e735c533",
          "event_type": "entry",
          "geofence_id": "51d0116d-c698-4126-b516-7c1bc6667bb9",
          "geofence_name": "Presidio Security Restricted Enclave",
          "category": "restricted_zone",
          "timestamp": "2026-11-07T07:24:57Z"
        }
      ],
      "time_ns": "13868500"
    }
    ```

- **`GET /vehicles/location/{vehicle_id}`**
  - **Description**: Retrieves the most recent recorded GPS position for a vehicle.

---

### D. Alert Rules API
- **`GET /alerts`**
  - **Optional Query Params**: `geofence_id`, `vehicle_id`
  - **Response (200 OK)**: Returns configured alert rules with joined geofence names and vehicle numbers.

- **`POST /alerts/configure`**
  - **Description**: Arms an alert rule for entry, exit, or both.
  - **Request Body**:
    ```json
    {
      "geofence_id": "51d0116d-c698-4126-b516-7c1bc6667bb9",
      "vehicle_id": null,
      "event_type": "both",
      "is_active": true
    }
    ```
  - **Note**: Passing `"vehicle_id": null` establishes a **Global Fleet Rule** that triggers for any vehicle.

- **`PUT /alerts/{id}/toggle`**: Toggles rule activation (`{"is_active": false}`).
- **`DELETE /alerts/{id}`**: Deletes an alert rule.

---

### E. Violation History API
- **`GET /violations/history`**
  - **Supported Query Filters**:
    - `vehicle_id`: UUID
    - `geofence_id`: UUID
    - `event_type`: `entry` or `exit`
    - `start_date`: ISO8601 or YYYY-MM-DD
    - `end_date`: ISO8601 or YYYY-MM-DD
    - `limit`: Integer (default 50)
    - `offset`: Integer (default 0)
  - **Sample Response (200 OK)**:
    ```json
    {
      "violations": [
        {
          "id": "01d7b05f-548f-46ed-9cee-2568e735c533",
          "event_type": "entry",
          "vehicle_id": "55ba5a10-3d61-4d87-8234-70844764103f",
          "geofence_id": "51d0116d-c698-4126-b516-7c1bc6667bb9",
          "latitude": 37.8,
          "longitude": -122.46,
          "timestamp": "2026-11-07T07:24:57Z",
          "vehicle_number": "KA-01-AB-1234",
          "driver_name": "John Doe",
          "geofence_name": "Presidio Security Restricted Enclave",
          "category": "restricted_zone"
        }
      ],
      "total_count": 1,
      "limit": 50,
      "offset": 0,
      "time_ns": "17274600"
    }
    ```

---

### F. WebSocket Real-Time Stream
- **`GET /ws/alerts`**
  - **Protocol**: `ws://` or `wss://`
  - **Broadcast Message Structure**:
    ```json
    {
      "event_id": "01d7b05f-548f-46ed-9cee-2568e735c533",
      "event_type": "entry",
      "timestamp": "2026-11-07T07:24:57Z",
      "vehicle": {
        "vehicle_id": "55ba5a10-3d61-4d87-8234-70844764103f",
        "vehicle_number": "KA-01-AB-1234",
        "driver_name": "John Doe"
      },
      "geofence": {
        "geofence_id": "51d0116d-c698-4126-b516-7c1bc6667bb9",
        "geofence_name": "Presidio Security Restricted Enclave",
        "category": "restricted_zone"
      },
      "location": {
        "latitude": 37.8,
        "longitude": -122.46
      }
    }
    ```

---

## 8. Automated Testing

### Backend Tests
Execute unit tests, spatial algorithms, and database integration tests:
```bash
cd backend
go test -v ./tests/...
```

Run race condition detector:
```bash
cd backend
go test -race ./tests/...
```

### Frontend Tests
Execute formatting, component logic, and API contract tests:
```bash
cd frontend
npm test
```

Production build validation:
```bash
cd frontend
npm run build
```

---

## 9. Architecture & Business Logic Details

### Point-in-Polygon & Transition Detection Engine
1. **Coordinate Format Transposition**:
   - Web API accepts: `[latitude, longitude]`.
   - PostGIS `ST_MakePoint` expects: `(longitude, latitude)`.
   - The Go spatial service explicitly maps input coordinates to `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`.
2. **Boundary Policy**:
   - `ST_Covers(geom, point)` is used consistently. Any point resting exactly on the perimeter line or vertex is strictly considered covered.
3. **Transition State Machine**:
   - For every incoming location update, the vehicle row is locked (`SELECT FOR UPDATE`) within a database transaction.
   - Previous geofence membership is loaded from `vehicle_geofence_states`.
   - Transitions are computed:
     - `Outside -> Inside` = **ENTRY** event
     - `Inside -> Outside` = **EXIT** event
     - `Inside -> Inside` = No new event (duplicate suppression)
     - `Outside -> Outside` = No new event
4. **Non-Blocking WebSocket Broadcast**:
   - Alert violations are persisted to the database inside the transaction.
   - Database transaction commits **before** WebSocket network broadcast.
   - Slow or disconnecting clients are handled via buffered channels without delaying HTTP responses.

