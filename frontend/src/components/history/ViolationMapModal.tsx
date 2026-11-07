import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
} from 'react-leaflet'
import L from 'leaflet'
import { EventBadge } from '../ui/badge'
import { formatCoordinates, formatDateTime } from '../../utils/formatters'
import type { Violation, Geofence, Coordinate } from '../../types'

interface ViolationMapModalProps {
  violation: Violation | null
  geofence?: Geofence | null
  isOpen: boolean
  onClose: () => void
}

export const ViolationMapModal: React.FC<ViolationMapModalProps> = ({
  violation,
  geofence,
  isOpen,
  onClose,
}) => {
  if (!violation) return null

  const markerIcon = L.divIcon({
    className: 'violation-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${violation.event_type === 'entry' ? '#16A36A' : '#E9A23B'};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        <svg style="width: 16px; height: 16px; color: white;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

  const polygonPositions: [number, number][] = geofence?.coordinates
    ? geofence.coordinates.map((c: Coordinate) => [c[0], c[1]])
    : []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <EventBadge eventType={violation.event_type} />
            <DialogTitle>Violation Spatial Record</DialogTitle>
          </div>
          <DialogDescription>
            Geospatial position and polygon context at time of event dispatch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs bg-[#F5F7FA] p-3 rounded-lg border border-[#E5EAF0]">
            <div>
              <span className="text-[#667085]">Vehicle: </span>
              <span className="font-bold text-[#172033]">{violation.vehicle_number}</span>
            </div>
            <div>
              <span className="text-[#667085]">Driver: </span>
              <span className="font-medium text-[#172033]">{violation.driver_name}</span>
            </div>
            <div>
              <span className="text-[#667085]">Geofence: </span>
              <span className="font-medium text-[#172033]">{violation.geofence_name}</span>
            </div>
            <div>
              <span className="text-[#667085]">Timestamp: </span>
              <span className="text-[#172033] font-medium">{formatDateTime(violation.timestamp)}</span>
            </div>
          </div>

          <div className="h-[280px] w-full rounded-lg border border-[#E5EAF0] overflow-hidden">
            <MapContainer
              center={[violation.latitude, violation.longitude]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {polygonPositions.length >= 3 && (
                <Polygon
                  positions={polygonPositions}
                  pathOptions={{
                    color: violation.category === 'restricted_zone' ? '#DC4C4C' : '#2563EB',
                    fillColor: violation.category === 'restricted_zone' ? '#DC4C4C' : '#2563EB',
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                />
              )}

              <Marker
                position={[violation.latitude, violation.longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <strong>{violation.vehicle_number}</strong>
                    <br />
                    {formatCoordinates(violation.latitude, violation.longitude)}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="text-[11px] font-mono text-[#667085] flex justify-between px-1">
            <span>Coordinates: {formatCoordinates(violation.latitude, violation.longitude)}</span>
            <span>SRID 4326</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
