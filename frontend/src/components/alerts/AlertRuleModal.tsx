import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import type { Geofence, Vehicle, AlertEventType } from '../../types'

interface AlertRuleModalProps {
  isOpen: boolean
  onClose: () => void
  geofences: Geofence[]
  vehicles: Vehicle[]
  onSubmit: (data: {
    geofence_id: string
    vehicle_id?: string | null
    event_type: AlertEventType
    is_active?: boolean
  }) => Promise<any>
}

export const AlertRuleModal: React.FC<AlertRuleModalProps> = ({
  isOpen,
  onClose,
  geofences,
  vehicles,
  onSubmit,
}) => {
  const [geofenceId, setGeofenceId] = useState(geofences[0]?.id || '')
  const [vehicleId, setVehicleId] = useState<string>('all')
  const [eventType, setEventType] = useState<AlertEventType>('both')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!geofenceId) {
      setError('Please select a target geofence')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        geofence_id: geofenceId,
        vehicle_id: vehicleId === 'all' ? null : vehicleId,
        event_type: eventType,
        is_active: true,
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to configure alert rule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Alert Rule</DialogTitle>
          <DialogDescription>
            Automate real-time notification dispatch when vehicles enter or exit perimeters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-[#DC4C4C] border border-red-200 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033] block">
              Target Geofence
            </label>
            <select
              className="flex h-9 w-full rounded-lg border border-[#E5EAF0] bg-white px-3 py-1.5 text-sm text-[#172033] focus:border-[#2563EB] focus:outline-none"
              value={geofenceId}
              onChange={(e) => setGeofenceId(e.target.value)}
              required
            >
              <option value="" disabled>
                -- Select Geofence --
              </option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.category.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033] block">
              Vehicle Scope
            </label>
            <select
              className="flex h-9 w-full rounded-lg border border-[#E5EAF0] bg-white px-3 py-1.5 text-sm text-[#172033] focus:border-[#2563EB] focus:outline-none"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="all">Global (All Vehicles in Fleet)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.driver_name} ({v.vehicle_type})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#667085]">
              Global rules monitor every vehicle. Specific rules trigger only for the selected asset.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033] block">
              Trigger Event Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'both', label: 'Entry & Exit' },
                { id: 'entry', label: 'Entry Only' },
                { id: 'exit', label: 'Exit Only' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEventType(opt.id as AlertEventType)}
                  className={`py-2 px-3 text-xs rounded-lg border font-medium transition-all ${
                    eventType === opt.id
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] shadow-xs'
                      : 'border-[#E5EAF0] bg-white text-[#667085] hover:bg-[#F5F7FA]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Configure Rule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
