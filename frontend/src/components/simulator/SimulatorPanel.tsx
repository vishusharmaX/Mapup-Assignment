import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Navigation,
  MousePointerClick,
  Activity,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/button'
import { formatCoordinates } from '../../utils/formatters'
import type { Vehicle, LocationUpdateResponse } from '../../types'
import { CategoryBadge } from '../ui/badge'

interface SimulatorPanelProps {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  onSelectVehicle: (vehicle: Vehicle) => void
  onUpdateLocation: (data: {
    vehicle_id: string
    latitude: number
    longitude: number
  }) => Promise<LocationUpdateResponse>
  isMapClickActive: boolean
  onToggleMapClick: () => void
  lastResult?: LocationUpdateResponse | null
}

// Preset route: Moves a vehicle from outside Presidio into the Restricted Enclave, then out again
const ROUTE_RESTRICTED_BREACH: [number, number][] = [
  [37.788, -122.48], // Outside - starting point
  [37.791, -122.474], // Approaching boundary
  [37.797, -122.464], // Inside Presidio Security Zone (Triggers ENTRY violation!)
  [37.801, -122.461], // Deeper inside
  [37.803, -122.458], // Still inside
  [37.808, -122.449], // Exits zone to north (Triggers EXIT violation!)
  [37.812, -122.445], // Outside
]

// Preset route: Downtown delivery corridor
const ROUTE_DOWNTOWN_DELIVERY: [number, number][] = [
  [37.778, -122.418], // Outside
  [37.781, -122.413], // Approaching Market St
  [37.786, -122.408], // Inside Downtown Delivery Zone (Triggers ENTRY!)
  [37.789, -122.404], // Center of Delivery Zone
  [37.784, -122.402], // Corner of Zone
  [37.779, -122.401], // Exits Delivery Zone (Triggers EXIT!)
]

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onUpdateLocation,
  isMapClickActive,
  onToggleMapClick,
  lastResult,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<'restricted' | 'delivery'>('restricted')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [speedMultiplier, setSpeedMultiplier] = useState(1) // 1x, 2x, 5x
  const [isUpdating, setIsUpdating] = useState(false)
  const timerRef = useRef<number | null>(null)

  const activeRoute = selectedRoute === 'restricted' ? ROUTE_RESTRICTED_BREACH : ROUTE_DOWNTOWN_DELIVERY

  // Stop simulation if vehicle unselected
  useEffect(() => {
    if (!selectedVehicle) {
      setIsPlaying(false)
      setCurrentStep(0)
    }
  }, [selectedVehicle])

  // Run simulation step
  const executeStep = async (stepIndex: number) => {
    if (!selectedVehicle) return
    const point = activeRoute[stepIndex]
    if (!point) return

    setIsUpdating(true)
    try {
      await onUpdateLocation({
        vehicle_id: selectedVehicle.id,
        latitude: point[0],
        longitude: point[1],
      })
    } catch (err) {
      console.error('Failed to update simulated position:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Timer loop for auto playback
  useEffect(() => {
    if (isPlaying) {
      const interval = Math.floor(2500 / speedMultiplier)
      timerRef.current = window.setTimeout(async () => {
        if (currentStep < activeRoute.length - 1) {
          const nextStep = currentStep + 1
          setCurrentStep(nextStep)
          await executeStep(nextStep)
        } else {
          // Finished route
          setIsPlaying(false)
        }
      }, interval)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, currentStep, speedMultiplier, activeRoute, selectedVehicle])

  const handleStart = async () => {
    if (!selectedVehicle) return
    setIsPlaying(true)
    if (currentStep === 0) {
      await executeStep(0)
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 shadow-sm space-y-4">
      {/* Header and Vehicle Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#172033] tracking-tight">
              Location Simulator
            </h3>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-sm bg-blue-50 text-[#2563EB] border border-blue-200">
              Test Harness
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Dispatches live GPS pings to backend <code className="text-[#101B2D] font-mono">POST /vehicles/location</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#172033] shrink-0">
            Target Vehicle:
          </label>
          <select
            className="h-8 text-xs rounded-lg border border-[#E5EAF0] px-2.5 bg-[#F5F7FA] font-medium text-[#172033] focus:outline-none focus:border-[#2563EB]"
            value={selectedVehicle?.id || ''}
            onChange={(e) => {
              const v = vehicles.find((item) => item.id === e.target.value)
              if (v) onSelectVehicle(v)
            }}
          >
            <option value="" disabled>
              -- Select a vehicle --
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number} ({v.driver_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedVehicle ? (
        <div className="py-6 text-center text-xs text-[#667085] bg-[#F5F7FA] rounded-lg border border-dashed border-[#E5EAF0]">
          Please select a vehicle above or click any vehicle on the map to begin simulating GPS movement.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode 1: Interactive Map Click */}
          <div className="p-3.5 rounded-lg border border-[#E5EAF0] bg-[#F5F7FA]/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 text-[#0F9D8A]" />
                Interactive Map Pin Mode
              </span>
              <Button
                size="sm"
                variant={isMapClickActive ? 'teal' : 'secondary'}
                onClick={onToggleMapClick}
                className="h-7 text-xs"
              >
                {isMapClickActive ? 'Click Mode Active' : 'Enable Map Click'}
              </Button>
            </div>
            <p className="text-[11px] text-[#667085]">
              When enabled, clicking anywhere on the map immediately transmits that GPS point for{' '}
              <strong>{selectedVehicle.vehicle_number}</strong>.
            </p>
            <div className="text-[11px] font-mono text-[#172033] bg-white px-2.5 py-1.5 rounded-md border border-[#E5EAF0]">
              Current GPS:{' '}
              {formatCoordinates(selectedVehicle.last_latitude, selectedVehicle.last_longitude)}
            </div>
          </div>

          {/* Mode 2: Automated Route Playback */}
          <div className="p-3.5 rounded-lg border border-[#E5EAF0] bg-[#F5F7FA]/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-[#2563EB]" />
                Automated Route Playback
              </span>
              <select
                className="h-7 text-[11px] rounded border border-[#E5EAF0] px-2 bg-white"
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value as any)
                  handleReset()
                }}
              >
                <option value="restricted">Restricted Zone Breach</option>
                <option value="delivery">Downtown Delivery Run</option>
              </select>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {!isPlaying ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleStart}
                    className="h-7 text-xs"
                  >
                    <Play className="h-3 w-3 mr-1 fill-current" /> Run Route
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handlePause}
                    className="h-7 text-xs"
                  >
                    <Pause className="h-3 w-3 mr-1 fill-current" /> Pause
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-7 text-xs px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>

              {/* Speed Multiplier */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-[#667085]">Speed:</span>
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSpeedMultiplier(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      speedMultiplier === spd
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white text-[#667085] border border-[#E5EAF0]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-[#E5EAF0] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / activeRoute.length) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#667085]">
                <span>Waypoint {currentStep + 1} of {activeRoute.length}</span>
                <span>{isUpdating ? 'Sending...' : isPlaying ? 'Running' : 'Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backend Detection Result Banner */}
      {lastResult && (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/60 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold text-[#172033]">
            <span className="flex items-center gap-1.5 text-[#2563EB]">
              <Layers className="h-3.5 w-3.5" />
              Backend Geospatial Result:
            </span>
            <span className="text-[10px] text-[#667085] font-mono">
              Server Time: {lastResult.time_ns ? `${(parseInt(lastResult.time_ns) / 1000).toFixed(1)} µs` : 'OK'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#667085]">Covering Geofences:</span>
            {lastResult.current_geofences.length === 0 ? (
              <span className="text-[#667085] italic">Outside all geofences</span>
            ) : (
              lastResult.current_geofences.map((g) => (
                <CategoryBadge key={g.geofence_id} category={g.category} />
              ))
            )}
          </div>

          {lastResult.events && lastResult.events.length > 0 && (
            <div className="pt-2 border-t border-blue-200/80 space-y-1">
              <div className="font-semibold text-xs text-[#DC4C4C] flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Alerts Generated by Backend:
              </div>
              {lastResult.events.map((evt) => (
                <div
                  key={evt.event_id}
                  className="bg-white/90 p-2 rounded border border-[#DC4C4C]/30 text-xs flex items-center justify-between"
                >
                  <span className="font-medium text-[#172033]">
                    {evt.event_type.toUpperCase()} &rarr; {evt.geofence_name}
                  </span>
                  <span className="text-[10px] font-mono text-[#667085]">
                    ID: {evt.event_id.slice(0, 8)}...
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
