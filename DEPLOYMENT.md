# FleetPulse — Production Deployment Guide

This guide provides step-by-step instructions to obtain the three required submission deliverables for the MapUp assessment:

1. **Docker Hub Image link**
2. **Base URL of your deployed Backend**
3. **Base URL of your deployed Frontend**

---

## Deliverable 1: Docker Hub Image Link

### Target URL format:
```text
https://hub.docker.com/r/<your-dockerhub-username>/fleetpulse-backend
```
*(or image tag: `<your-dockerhub-username>/fleetpulse-backend:latest`)*

### Method A: Local Terminal (Recommended)

1. **Launch Docker Desktop** on your computer.
2. Open your terminal in the project root directory (`d:\Coding\Mapup Assignment`).
3. Log in to Docker Hub:
   ```bash
   docker login
   ```
4. Build and tag the production backend image:
   ```bash
   docker build -t <your-dockerhub-username>/fleetpulse-backend:latest ./backend
   ```
5. Push the image to Docker Hub:
   ```bash
   docker push <your-dockerhub-username>/fleetpulse-backend:latest
   ```
6. Verify your repository is public on [hub.docker.com](https://hub.docker.com).

### Method B: Automated via GitHub Actions
A pre-configured GitHub Actions workflow (`.github/workflows/docker-publish.yml`) is included in this repository:
1. Push this repository to GitHub.
2. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
3. Add two repository secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username.
   - `DOCKERHUB_TOKEN`: A Personal Access Token generated from Docker Hub (**Account Settings > Security > Access Tokens**).
4. Run the **Build and Publish Docker Images** workflow from the **Actions** tab.

---

## Deliverable 2: Base URL of Your Deployed Backend

### Target URL format:
```text
https://fleetpulse-backend.onrender.com
```

FleetPulse requires PostgreSQL 15+ with the **PostGIS** geospatial extension enabled. Follow this free, production-tested deployment setup:

### Step 2.1: Provision a Free PostGIS Database (Supabase)

1. Sign up / Log in to [supabase.com](https://supabase.com).
2. Click **New Project** (e.g. named `fleetpulse-db`, set database password).
3. Once initialized, navigate to the **SQL Editor** on the left menu.
4. Run this query to ensure PostGIS and UUID extensions are enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
5. Go to **Project Settings > Database > Connection string > URI**.
6. Copy the connection string. It will look like:
   ```text
   postgresql://postgres.cfkgqdnqefmdhflrtqxo:vishu%40A20041234@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require
   ```

*(Alternative: You can also use [neon.tech](https://neon.tech) or [railway.app](https://railway.app) which both natively support PostGIS).*

### Step 2.2: Deploy Go Backend on Render (Free Web Service)

1. Push your project to GitHub:
   ```bash
   git remote add origin https://github.com/<your-github-username>/fleetpulse.git
   git push -u origin master
   ```
2. Sign up / Log in to [render.com](https://render.com).
3. Click **New + > Web Service**.
4. Connect your `fleetpulse` GitHub repository.
5. Fill in the service configuration:
   - **Name**: `fleetpulse-backend`
   - **Region**: Choose the closest region to your database (e.g. Oregon or Frankfurt).
   - **Root Directory**: `backend`
   - **Runtime**: `Go` (or `Docker`)
   - **Build Command**: `go build -o server ./cmd/server`
   - **Start Command**: `./server`
6. Scroll down to **Environment Variables** and add:
   - `PORT`: `8080`
   - `DATABASE_URL`: *(Paste your Supabase connection string with `?sslmode=require`)*
   - `ENVIRONMENT`: `production`
   - `LOG_LEVEL`: `info`
   - `CORS_ALLOWED_ORIGINS`: `*`
7. Click **Deploy Web Service**.
8. Once deployment finishes, Render provides your public backend URL, e.g.:
   ```text
   https://fleetpulse-backend.onrender.com
   ```
   - Test it in your browser: `https://fleetpulse-backend.onrender.com/health` (should return HTTP 200 with `status: healthy` and `time_ns`).

*(Note: The FleetPulse backend automatically runs schema migrations and auto-seeds initial demo vehicles and geofences if the database is fresh).*

---

## Deliverable 3: Base URL of Your Deployed Frontend

### Target URL format:
```text
https://fleetpulse-frontend.vercel.app
```

Deploying the React + Vite frontend to Vercel takes under 2 minutes:

### Step 3.1: Deploy on Vercel

1. Sign up / Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New... > Project**.
3. Import your `fleetpulse` repository.
4. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL`: Your deployed backend URL from Deliverable 2:
     ```text
     https://fleetpulse-backend.onrender.com
     ```
   - `VITE_WS_URL`: Your WebSocket endpoint:
     ```text
     wss://fleetpulse-backend.onrender.com/ws/alerts
     ```
6. Click **Deploy**.
7. Vercel automatically deploys the frontend and assigns a live domain:
   ```text
   https://fleetpulse-frontend.vercel.app
   ```

---

## Deliverable 4: Verification & Sanity Check

Once deployed, verify the end-to-end flow:

1. Open your Vercel URL in your browser: `https://fleetpulse-frontend.vercel.app`.
2. **Overview Page**: Verify KPI cards (Total Vehicles: 4+, Total Geofences: 4+) load real data from your backend.
3. **Live Tracking Page**:
   - Geofence polygons (Presidio Restricted Enclave, Downtown Delivery Zone, etc.) appear on the Leaflet map.
   - Click a vehicle in the simulator panel, choose a coordinate or preset (e.g. "Inside Restricted Enclave").
   - Confirm real-time WebSocket toast notifications appear and vehicle status updates instantly.
4. **Violations History Page**: Confirm that boundary violations are recorded and visible in the audit table with coordinate inspection modals.

---

## Submission Checklist Summary

| Field | Example Submission Value |
| :--- | :--- |
| **Docker Hub Image link** | `https://hub.docker.com/r/johndoe/fleetpulse-backend` |
| **Base URL of your deployed Frontend** | `https://fleetpulse-frontend.vercel.app` |
| **Base URL of your deployed Backend** | `https://fleetpulse-backend.onrender.com` |

