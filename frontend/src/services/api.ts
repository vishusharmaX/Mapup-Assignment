import axios from 'axios'
import type {
  Geofence,
  Vehicle,
  AlertRule,
  Violation,
  LocationUpdateResponse,
  StatsOverview,
  Coordinate,
  GeofenceCategory,
  VehicleType,
  AlertEventType,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Geofences
export const getGeofences = async (category?: string): Promise<{ geofences: Geofence[]; time_ns?: string }> => {
  const params = category ? { category } : {}
  const res = await apiClient.get('/geofences', { params })
  return {
    geofences: res.data.geofences || res.data.data || [],
    time_ns: res.data.time_ns,
  }
}

export const createGeofence = async (data: {
  name: string
  description?: string
  category: GeofenceCategory
  coordinates: Coordinate[]
}): Promise<Geofence & { time_ns?: string }> => {
  const res = await apiClient.post('/geofences', data)
  return res.data
}

export const updateGeofence = async (
  id: string,
  data: Partial<{
    name: string
    description: string
    category: GeofenceCategory
    coordinates: Coordinate[]
    is_active: boolean
  }>
): Promise<Geofence & { time_ns?: string }> => {
  const res = await apiClient.put(`/geofences/${id}`, data)
  return res.data
}

export const deleteGeofence = async (id: string): Promise<{ message: string; time_ns?: string }> => {
  const res = await apiClient.delete(`/geofences/${id}`)
  return res.data
}

// Vehicles
export const getVehicles = async (): Promise<{ vehicles: Vehicle[]; time_ns?: string }> => {
  const res = await apiClient.get('/vehicles')
  return {
    vehicles: res.data.vehicles || res.data.data || [],
    time_ns: res.data.time_ns,
  }
}

export const getVehicle = async (id: string): Promise<Vehicle & { time_ns?: string }> => {
  const res = await apiClient.get(`/vehicles/${id}`)
  return res.data
}

export const createVehicle = async (data: {
  vehicle_number: string
  driver_name: string
  vehicle_type: VehicleType
  phone_number: string
}): Promise<Vehicle & { time_ns?: string }> => {
  const res = await apiClient.post('/vehicles', data)
  return res.data
}

export const updateVehicle = async (
  id: string,
  data: Partial<{
    vehicle_number: string
    driver_name: string
    vehicle_type: VehicleType
    phone_number: string
    status: string
  }>
): Promise<Vehicle & { time_ns?: string }> => {
  const res = await apiClient.put(`/vehicles/${id}`, data)
  return res.data
}

export const deleteVehicle = async (id: string): Promise<{ message: string; time_ns?: string }> => {
  const res = await apiClient.delete(`/vehicles/${id}`)
  return res.data
}

// Location Tracking
export const updateVehicleLocation = async (data: {
  vehicle_id: string
  latitude: number
  longitude: number
  timestamp?: string
}): Promise<LocationUpdateResponse> => {
  const res = await apiClient.post('/vehicles/location', {
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  })
  return res.data
}

export const getVehicleLastLocation = async (
  vehicleId: string
): Promise<{ id: string; vehicle_id: string; latitude: number; longitude: number; recorded_at: string; time_ns?: string }> => {
  const res = await apiClient.get(`/vehicles/location/${vehicleId}`)
  return res.data
}

// Alert Rules
export const getAlertRules = async (
  geofenceId?: string,
  vehicleId?: string
): Promise<{ alerts: AlertRule[]; time_ns?: string }> => {
  const params: Record<string, string> = {}
  if (geofenceId) params.geofence_id = geofenceId
  if (vehicleId) params.vehicle_id = vehicleId
  const res = await apiClient.get('/alerts', { params })
  return {
    alerts: res.data.alerts || res.data.data || [],
    time_ns: res.data.time_ns,
  }
}

export const configureAlertRule = async (data: {
  geofence_id: string
  vehicle_id?: string | null
  event_type: AlertEventType
  is_active?: boolean
}): Promise<AlertRule & { time_ns?: string }> => {
  const res = await apiClient.post('/alerts/configure', data)
  return res.data
}

export const deleteAlertRule = async (id: string): Promise<{ message: string; time_ns?: string }> => {
  const res = await apiClient.delete(`/alerts/${id}`)
  return res.data
}

export const toggleAlertRule = async (id: string, is_active: boolean): Promise<{ message: string; time_ns?: string }> => {
  const res = await apiClient.put(`/alerts/${id}/toggle`, { is_active })
  return res.data
}

// Violations History
export const getViolationsHistory = async (params: {
  vehicle_id?: string
  geofence_id?: string
  event_type?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}): Promise<{ violations: Violation[]; total_count: number; time_ns?: string }> => {
  const res = await apiClient.get('/violations/history', { params })
  return {
    violations: res.data.violations || res.data.data || [],
    total_count: res.data.total_count || 0,
    time_ns: res.data.time_ns,
  }
}

// Health & Stats
export const getHealth = async (): Promise<{ status: string; database: string; time_ns?: string }> => {
  const res = await apiClient.get('/health')
  return res.data
}

export const getOverviewStats = async (): Promise<StatsOverview> => {
  const res = await apiClient.get('/stats/overview')
  return res.data
}

