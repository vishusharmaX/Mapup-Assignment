import React, { useState } from 'react'
import { History } from 'lucide-react'
import { ViolationTable } from '../components/history/ViolationTable'
import { useViolations, type UseViolationsParams } from '../hooks/useViolations'
import { useVehicles } from '../hooks/useVehicles'
import { useGeofences } from '../hooks/useGeofences'

export const ViolationsPage: React.FC = () => {
  const [filterParams, setFilterParams] = useState<UseViolationsParams>({})
  const { violations, totalCount, isLoading } = useViolations(filterParams)
  const { vehicles } = useVehicles()
  const { geofences } = useGeofences()

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5EAF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Violation & Transition Audit History
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Immutable chronological audit log of all perimeter entry and exit events detected across the fleet.
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-[#172033]">{totalCount}</div>
          <div className="text-[11px] text-[#667085]">Total Indexed Incidents</div>
        </div>
      </div>

      {/* Main Filterable History Table */}
      <ViolationTable
        violations={violations}
        totalCount={totalCount}
        isLoading={isLoading}
        vehicles={vehicles}
        geofences={geofences}
        onFilterChange={(newFilters) => setFilterParams(newFilters)}
      />
    </div>
  )
}
