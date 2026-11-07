import React, { useState } from 'react'
import { FleetMap } from '../components/map/FleetMap'
import { SimulatorPanel } from '../components/simulator/SimulatorPanel'
import { useVehicles } from '../hooks/useVehicles'
import { useGeofences } from '../hooks/useGeofences'
import { StatusBadge } from '../components/ui/badge'
import { formatCoordinates, formatTimeAgo } from '../utils/formatters'
import { Search, Truck } from 'lucide-react'
import type { Vehicle, LocationUpdateResponse } from '../types'

export const LiveTrackingPage: React.FC = () => {
  const { vehicles, updateLocation } = useVehicles()
  const { geofences } = useGeofences()

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(
    vehicles[0] || null
  )
  const [isMapClickActive, setIsMapClickActive] = useState(false)
  const [lastResult, setLastResult] = useState<LocationUpdateResponse | null>(null)
  const [vehicleSearch, setVehicleSearch] = useState('')

  // Handle map click when map click mode is active
  const handleMapClick = async (lat: number, lon: number) => {
    if (!isMapClickActive || !selectedVehicle) return

    try {
      const resp = await updateLocation({
        vehicle_id: selectedVehicle.id,
        latitude: lat,
        longitude: lon,
      })
      setLastResult(resp)

      // Update selected vehicle local state
      setSelectedVehicle((prev: Vehicle | null) =>
        prev
          ? {
              ...prev,
              last_latitude: lat,
              last_longitude: lon,
              last_location_time: new Date().toISOString(),
              status: 'active',
            }
          : null
      )
    } catch (err) {
      console.error('Failed to update vehicle location via map click:', err)
    }
  }

  const handleSimulatorUpdate = async (data: {
    vehicle_id: string
    latitude: number
    longitude: number
  }) => {
    const resp = await updateLocation(data)
    setLastResult(resp)
    setSelectedVehicle((prev: Vehicle | null) =>
      prev && prev.id === data.vehicle_id
        ? {
            ...prev,
            last_latitude: data.latitude,
            last_longitude: data.longitude,
            last_location_time: new Date().toISOString(),
            status: 'active',
          }
        : prev
    )
    return resp
  }

  const filteredVehicles = vehicles.filter((v) =>
    v.vehicle_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.driver_name.toLowerCase().includes(vehicleSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Location Simulator Panel */}
      <SimulatorPanel
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={(v) => setSelectedVehicle(v)}
        onUpdateLocation={handleSimulatorUpdate}
        isMapClickActive={isMapClickActive}
        onToggleMapClick={() => setIsMapClickActive((prev) => !prev)}
        lastResult={lastResult}
      />

      {/* Main Map & Vehicles Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[580px]">
        {/* Left Side: Vehicle Assets List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-[#E5EAF0] p-4 flex flex-col shadow-xs order-2 lg:order-1">
          <div className="pb-3 border-b border-[#E5EAF0]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[#2563EB]" />
                Fleet Assets ({vehicles.length})
              </span>
              <span className="text-[10px] text-[#667085]">
                {vehicles.filter((v) => v.status === 'active').length} active
              </span>
            </div>
            <div className="relative mt-2.5">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search asset or driver..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="h-8 text-xs w-full pl-8 pr-3 rounded-lg border border-[#E5EAF0] bg-[#F5F7FA] text-[#172033] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {/* Scrollable vehicle list */}
          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 max-h-[460px]">
            {filteredVehicles.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#667085]">
                No vehicles matching search.
              </div>
            ) : (
              filteredVehicles.map((v) => {
                const isSelected = selectedVehicle?.id === v.id
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/70 shadow-xs'
                        : 'border-[#E5EAF0] bg-white hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172033]">
                        {v.vehicle_number}
                      </span>
                      <StatusBadge status={v.status} />
                    </div>

                    <div className="text-[11px] text-[#667085] mt-1">
                      {v.driver_name} &bull; <span className="capitalize">{v.vehicle_type}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#E5EAF0]/80 flex items-center justify-between text-[10px] text-[#94A3B8]">
                      <span className="font-mono">
                        {v.last_latitude != null
                          ? formatCoordinates(v.last_latitude, v.last_longitude)
                          : 'No coordinates'}
                      </span>
                      <span>{formatTimeAgo(v.last_location_time)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5EAF0] overflow-hidden shadow-xs relative min-h-[500px] order-1 lg:order-2">
          <FleetMap
            geofences={geofences}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicle?.id}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
            onMapClick={handleMapClick}
            isSimulating={isMapClickActive}
            height="100%"
          />
        </div>
      </div>
    </div>
  )
}
