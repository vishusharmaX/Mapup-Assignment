import React, { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import type { Geofence, Vehicle, Coordinate } from '../../types'
import { MapLegend } from './MapLegend'
import { formatCoordinates, formatTimeAgo } from '../../utils/formatters'
import { CategoryBadge, StatusBadge } from '../ui/badge'

interface FleetMapProps {
  geofences: Geofence[]
  vehicles: Vehicle[]
  selectedVehicleId?: string | null
  onSelectVehicle?: (vehicle: Vehicle) => void
  onMapClick?: (lat: number, lon: number) => void
  isSimulating?: boolean
  center?: [number, number]
  zoom?: number
  height?: string
}

// Map Click Handler component
function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

// Map Auto-Fitter component
function MapAutoFitter({
  geofences,
  vehicles,
}: {
  geofences: Geofence[]
  vehicles: Vehicle[]
}) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []

    for (const g of geofences) {
      if (g.coordinates && g.coordinates.length > 0) {
        for (const pt of g.coordinates) {
          points.push([pt[0], pt[1]])
        }
      }
    }

    for (const v of vehicles) {
      if (v.last_latitude != null && v.last_longitude != null) {
        points.push([v.last_latitude, v.last_longitude])
      }
    }

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      } catch (err) {
        console.warn('Could not fit bounds:', err)
      }
    }
  }, [geofences, vehicles, map])

  return null
}

export const FleetMap: React.FC<FleetMapProps> = ({
  geofences,
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onMapClick,
  isSimulating = false,
  center = [37.785, -122.42], // San Francisco default
  zoom = 13,
  height = '100%',
}) => {
  // Polygon Styling depending on category
  const getPolygonStyle = (category: string) => {
    switch (category) {
      case 'restricted_zone':
        return {
          color: '#DC4C4C',
          fillColor: '#DC4C4C',
          fillOpacity: 0.22,
          weight: 2,
          dashArray: '4, 4',
        }
      case 'delivery_zone':
        return {
          color: '#2563EB',
          fillColor: '#2563EB',
          fillOpacity: 0.18,
          weight: 2,
        }
      case 'toll_zone':
        return {
          color: '#E9A23B',
          fillColor: '#E9A23B',
          fillOpacity: 0.18,
          weight: 2,
        }
      case 'customer_area':
        return {
          color: '#0F9D8A',
          fillColor: '#0F9D8A',
          fillOpacity: 0.18,
          weight: 2,
        }
      default:
        return {
          color: '#2563EB',
          fillColor: '#2563EB',
          fillOpacity: 0.15,
          weight: 2,
        }
    }
  }

  // Create custom marker icon for vehicle
  const createVehicleIcon = (vehicle: Vehicle, isSelected: boolean) => {
    const statusColor =
      vehicle.status === 'active'
        ? '#16A36A'
        : vehicle.status === 'idle'
        ? '#E9A23B'
        : '#94A3B8'

    const pulseClass = vehicle.status === 'active' ? 'vehicle-pulse' : ''

    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
          <div style="
            background-color: ${isSelected ? '#2563EB' : '#101B2D'};
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            white-space: nowrap;
            margin-bottom: 3px;
            border: ${isSelected ? '2px solid #FFFFFF' : '1px solid #334155'};
          ">
            ${vehicle.vehicle_number}
          </div>
          <div class="${pulseClass}" style="
            width: 26px;
            height: 26px;
            background-color: ${statusColor};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            <svg style="width: 14px; height: 14px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -42],
    })
  }

  return (
    <div className="relative w-full h-full min-h-[450px]" style={{ height }}>
      {isSimulating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-[#101B2D]/90 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-xs border border-white/20 flex items-center gap-2 pointer-events-none animate-pulse">
          <span className="h-2 w-2 rounded-full bg-[#0F9D8A]" />
          <span>Click anywhere on the map to move selected vehicle</span>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapClickHandler onMapClick={onMapClick} />
        <MapAutoFitter geofences={geofences} vehicles={vehicles} />

        {/* Render Geofences */}
        {geofences.map((g) => {
          if (!g.coordinates || g.coordinates.length < 3) return null
          const positions: [number, number][] = g.coordinates.map((c: Coordinate) => [
            c[0],
            c[1],
          ])
          const style = getPolygonStyle(g.category)

          return (
            <Polygon
              key={g.id}
              positions={positions}
              pathOptions={style}
            >
              <Tooltip sticky>
                <div className="p-1 space-y-1">
                  <div className="font-semibold text-xs text-[#172033]">{g.name}</div>
                  <CategoryBadge category={g.category} />
                </div>
              </Tooltip>
              <Popup>
                <div className="p-2 space-y-2 text-xs">
                  <div className="font-bold text-sm text-[#172033]">{g.name}</div>
                  {g.description && (
                    <p className="text-[#667085]">{g.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#E5EAF0]">
                    <CategoryBadge category={g.category} />
                    <span className="text-[10px] text-[#667085]">
                      {g.coordinates.length} points
                    </span>
                  </div>
                </div>
              </Popup>
            </Polygon>
          )
        })}

        {/* Render Vehicles with known positions */}
        {vehicles.map((v) => {
          if (v.last_latitude == null || v.last_longitude == null) return null
          const isSelected = v.id === selectedVehicleId
          const icon = createVehicleIcon(v, isSelected)

          return (
            <Marker
              key={v.id}
              position={[v.last_latitude, v.last_longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectVehicle) onSelectVehicle(v)
                },
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 min-w-[180px]">
                  <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-1.5">
                    <span className="font-bold text-sm text-[#172033]">
                      {v.vehicle_number}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="text-xs space-y-1 text-[#667085]">
                    <div>
                      <span className="font-medium text-[#172033]">Driver: </span>
                      {v.driver_name}
                    </div>
                    <div>
                      <span className="font-medium text-[#172033]">Type: </span>
                      <span className="capitalize">{v.vehicle_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#172033]">Phone: </span>
                      {v.phone_number}
                    </div>
                    <div>
                      <span className="font-medium text-[#172033]">Coordinates: </span>
                      <span className="font-mono text-[11px]">
                        {formatCoordinates(v.last_latitude, v.last_longitude)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-[#172033]">Updated: </span>
                      {formatTimeAgo(v.last_location_time)}
                    </div>
                  </div>
                  {onSelectVehicle && (
                    <button
                      onClick={() => onSelectVehicle(v)}
                      className="w-full mt-2 py-1 px-2 rounded-md bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8] transition-colors"
                    >
                      Select for Simulation
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <MapLegend />
    </div>
  )
}
