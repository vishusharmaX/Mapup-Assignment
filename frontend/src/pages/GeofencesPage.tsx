import React, { useState } from 'react'
import { PlusCircle, ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/button'
import { GeofenceTable } from '../components/geofences/GeofenceTable'
import { GeofenceModal } from '../components/geofences/GeofenceModal'
import { useGeofences } from '../hooks/useGeofences'

interface GeofencesPageProps {
  onNavigateToTracking?: () => void
}

export const GeofencesPage: React.FC<GeofencesPageProps> = ({
  onNavigateToTracking,
}) => {
  const { geofences, isLoading, createGeofence, deleteGeofence } = useGeofences()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const restrictedCount = geofences.filter((g) => g.category === 'restricted_zone').length
  const deliveryCount = geofences.filter((g) => g.category === 'delivery_zone').length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5EAF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Geofence Perimeter Management
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Construct, categorize, and enforce spatial polygon boundaries with PostGIS precision.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="text-xs"
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Create New Geofence
        </Button>
      </div>

      {/* Category Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="text-[11px] font-semibold text-[#2563EB] uppercase">Delivery Zones</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{deliveryCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-red-50/70 border border-red-200">
          <div className="text-[11px] font-semibold text-[#DC4C4C] uppercase">Restricted Zones</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{restrictedCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
          <div className="text-[11px] font-semibold text-[#E9A23B] uppercase">Toll Corridors</div>
          <div className="text-xl font-bold text-[#172033] mt-1">
            {geofences.filter((g) => g.category === 'toll_zone').length}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="text-[11px] font-semibold text-[#0F9D8A] uppercase">Customer Hubs</div>
          <div className="text-xl font-bold text-[#172033] mt-1">
            {geofences.filter((g) => g.category === 'customer_area').length}
          </div>
        </div>
      </div>

      {/* Main Geofences Table */}
      <GeofenceTable
        geofences={geofences}
        isLoading={isLoading}
        onDelete={deleteGeofence}
        onSelectGeofence={() => {
          if (onNavigateToTracking) onNavigateToTracking()
        }}
      />

      {/* Modal */}
      <GeofenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createGeofence}
      />
    </div>
  )
}
