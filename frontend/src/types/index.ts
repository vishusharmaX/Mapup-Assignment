export type Coordinate = [number, number] // [latitude, longitude]

export type GeofenceCategory =
  | 'delivery_zone'
  | 'restricted_zone'
  | 'toll_zone'
  | 'customer_area'

export interface Geofence {
  id: string
  name: string
  description?: string
  category: GeofenceCategory
  coordinates: Coordinate[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VehicleType = 'truck' | 'car' | 'van' | 'motorcycle'
export type VehicleStatus = 'active' | 'idle' | 'offline'

export interface Vehicle {
  id: string
  vehicle_number: string
  driver_name: string
  vehicle_type: VehicleType
  phone_number: string
  status: VehicleStatus
  last_latitude?: number | null
  last_longitude?: number | null
  last_location_time?: string | null
  created_at: string
  updated_at: string
}

export type AlertEventType = 'entry' | 'exit' | 'both'

export interface AlertRule {
  id: string
  geofence_id: string
  vehicle_id?: string | null
  event_type: AlertEventType
  is_active: boolean
  created_at: string
  updated_at: string
  geofence_name?: string
  category?: string
  vehicle_number?: string | null
}

export interface Violation {
  id: string
  event_type: 'entry' | 'exit'
  vehicle_id: string
  geofence_id: string
  alert_rule_id?: string | null
  latitude: number
  longitude: number
  timestamp: string
  created_at: string
  vehicle_number?: string
  driver_name?: string
  vehicle_type?: string
  geofence_name?: string
  category?: string
}

export interface CurrentGeofenceInfo {
  geofence_id: string
  name: string
  category: GeofenceCategory
}

export interface DetectedTransitionEvent {
  event_id: string
  event_type: 'entry' | 'exit'
  geofence_id: string
  geofence_name: string
  category?: GeofenceCategory
  timestamp: string
}

export interface LocationUpdateResponse {
  vehicle_id: string
  latitude: number
  longitude: number
  timestamp: string
  current_geofences: CurrentGeofenceInfo[]
  events: DetectedTransitionEvent[]
  time_ns?: string
}

export interface WebSocketAlertEvent {
  event_id: string
  event_type: 'entry' | 'exit'
  timestamp: string
  vehicle: {
    vehicle_id: string
    vehicle_number: string
    driver_name: string
  }
  geofence: {
    geofence_id: string
    geofence_name: string
    category: string
  }
  location: {
    latitude: number
    longitude: number
  }
}

export interface StatsOverview {
  total_vehicles: number
  active_vehicles: number
  idle_vehicles: number
  offline_vehicles: number
  total_geofences: number
  total_alert_rules: number
  active_alert_rules: number
  total_violations: number
  recent_events: Violation[]
  frequent_geofences: Array<{
    geofence_id: string
    name: string
    category: string
    count: number
  }>
  time_ns?: string
}

export interface ApiResponse<T> {
  data?: T
  time_ns?: string
  error?: string
}
