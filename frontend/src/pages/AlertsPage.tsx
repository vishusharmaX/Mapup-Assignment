import React, { useState } from 'react'
import { PlusCircle, BellRing } from 'lucide-react'
import { Button } from '../components/ui/button'
import { AlertRuleTable } from '../components/alerts/AlertRuleTable'
import { AlertRuleModal } from '../components/alerts/AlertRuleModal'
import { useAlerts } from '../hooks/useAlerts'
import { useGeofences } from '../hooks/useGeofences'
import { useVehicles } from '../hooks/useVehicles'

export const AlertsPage: React.FC = () => {
  const { alerts, isLoading, configureAlert, deleteAlert, toggleAlert } = useAlerts()
  const { geofences } = useGeofences()
  const { vehicles } = useVehicles()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const activeCount = alerts.filter((a) => a.is_active).length
  const globalCount = alerts.filter((a) => !a.vehicle_id).length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5EAF0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Alert Trigger Rules
            </h2>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Establish automated boundary breach policies. Match vehicle transitions against polygons in real time.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="text-xs"
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Configure New Rule
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white border border-[#E5EAF0]">
          <div className="text-[11px] font-semibold text-[#667085] uppercase">Total Configured Rules</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{alerts.length}</div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="text-[11px] font-semibold text-[#16A36A] uppercase">Active & Armed</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{activeCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="text-[11px] font-semibold text-[#2563EB] uppercase">Global Fleet Scope</div>
          <div className="text-xl font-bold text-[#172033] mt-1">{globalCount}</div>
        </div>
      </div>

      {/* Table */}
      <AlertRuleTable
        alerts={alerts}
        isLoading={isLoading}
        onDelete={deleteAlert}
        onToggleActive={(id, active) => toggleAlert({ id, is_active: active })}
      />

      {/* Modal */}
      <AlertRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        geofences={geofences}
        vehicles={vehicles}
        onSubmit={configureAlert}
      />
    </div>
  )
}
