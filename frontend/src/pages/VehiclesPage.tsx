import React, { useState } from 'react'
import { PlusCircle, Truck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { VehicleTable } from '../components/vehicles/VehicleTable'
import { VehicleModal } from '../components/vehicles/VehicleModal'
import { useVehicles } from '../hooks/useVehicles'

interface VehiclesPageProps {
  onNavigateToTracking?: () => void
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({
  onNavigateToTracking,
}) => {
  const { vehicles, isLoading, createVehicle, deleteVehicle } = useVehicles()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const activeCount = vehicles.filter((v) => v.status === 'active').length
  const trucksCount = vehicles.filter((v) => v.vehicle_type === 'truck').length
  const vansCount = vehicles.filter((v) => v.vehicle_type === 'van').length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5EAF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Vehicle Asset Registry
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Maintain fleet inventory, driver assignments, contact telemetry, and real-time operational status.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="text-xs"
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Register New Vehicle
        </Button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white border border-[#E5EAF0]">
          <div className="text-[11px] font-semibold text-[#667085] uppercase">Total Registered</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{vehicles.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="text-[11px] font-semibold text-[#16A36A] uppercase">Active In Field</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{activeCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="text-[11px] font-semibold text-[#2563EB] uppercase">Heavy Trucks</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{trucksCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
          <div className="text-[11px] font-semibold text-[#E9A23B] uppercase">Delivery Vans</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{vansCount}</div>
        </div>
      </div>

      {/* Main Vehicle Table */}
      <VehicleTable
        vehicles={vehicles}
        isLoading={isLoading}
        onDelete={deleteVehicle}
        onSelectVehicle={() => {
          if (onNavigateToTracking) onNavigateToTracking()
        }}
      />

      {/* Registration Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createVehicle}
      />
    </div>
  )
}

