import React, { useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  useMapEvents,
} from 'react-leaflet'
import { Button } from '../ui/button'
import { RotateCcw, Trash2, CheckCircle2 } from 'lucide-react'
import type { Coordinate } from '../../types'

interface PolygonDrawerProps {
  initialCoordinates?: Coordinate[]
  onChange: (coords: Coordinate[]) => void
}

function DrawerClickHandler({
  onAddPoint,
}: {
  onAddPoint: (lat: number, lon: number) => void
}) {
  useMapEvents({
    click(e) {
      onAddPoint(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export const PolygonDrawer: React.FC<PolygonDrawerProps> = ({
  initialCoordinates = [],
  onChange,
}) => {
  const [points, setPoints] = useState<Coordinate[]>(initialCoordinates)

  const handleAddPoint = (lat: number, lon: number) => {
    const updated: Coordinate[] = [...points, [lat, lon]]
    setPoints(updated)
    onChange(updated)
  }

  const handleUndo = () => {
    if (points.length === 0) return
    const updated = points.slice(0, -1)
    setPoints(updated)
    onChange(updated)
  }

  const handleClear = () => {
    setPoints([])
    onChange([])
  }

  const positions: [number, number][] = points.map((p) => [p[0], p[1]])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#667085]">
          Click on map to place polygon vertices ({points.length} points placed, min 3 required)
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUndo}
            disabled={points.length === 0}
            className="h-7 text-xs px-2"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Undo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={points.length === 0}
            className="h-7 text-xs px-2 text-[#DC4C4C] hover:text-[#DC4C4C]"
          >
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <div className="h-[280px] w-full rounded-lg border border-[#E5EAF0] overflow-hidden relative">
        <MapContainer
          center={[37.785, -122.42]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <DrawerClickHandler onAddPoint={handleAddPoint} />

          {/* Markers for vertices */}
          {points.map((pt, idx) => (
            <CircleMarker
              key={idx}
              center={[pt[0], pt[1]]}
              radius={5}
              pathOptions={{
                fillColor: idx === 0 ? '#16A36A' : '#2563EB',
                fillOpacity: 1,
                color: '#FFFFFF',
                weight: 2,
              }}
            />
          ))}

          {/* Polygon preview if >= 3 points */}
          {points.length >= 3 && (
            <Polygon
              positions={positions}
              pathOptions={{
                color: '#2563EB',
                fillColor: '#2563EB',
                fillOpacity: 0.25,
                weight: 2,
              }}
            />
          )}
        </MapContainer>

        {points.length >= 3 && (
          <div className="absolute bottom-2 left-2 z-[400] bg-emerald-50 text-[#16A36A] border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 shadow-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Valid Closed Polygon ({points.length} vertices)</span>
          </div>
        )}
      </div>
    </div>
  )
}
