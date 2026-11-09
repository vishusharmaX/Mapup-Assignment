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
import { Input } from '../ui/input'
import type { VehicleType } from '../../types'

interface VehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    vehicle_number: string
    driver_name: string
    vehicle_type: VehicleType
    phone_number: string
  }) => Promise<any>
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName, setDriverName] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('truck')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!vehicleNumber.trim()) {
      setError('Vehicle registration number is required')
      return
    }
    if (!driverName.trim()) {
      setError('Assigned driver name is required')
      return
    }
    if (!phoneNumber.trim()) {
      setError('Driver phone contact is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driver_name: driverName.trim(),
        vehicle_type: vehicleType,
        phone_number: phoneNumber.trim(),
      })
      // Reset
      setVehicleNumber('')
      setDriverName('')
      setPhoneNumber('')
      setVehicleType('truck')
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to register vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register Fleet Vehicle</DialogTitle>
          <DialogDescription>
            Add a new vehicle and assign an operator to enable tracking and alert monitoring.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-[#DC4C4C] border border-red-200 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. KA-01-AB-1234 or DL-05-XY-8899"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            required
          />

          <Input
            label="Driver Name"
            placeholder="e.g. Marcus Vance"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#172033] block">
              Vehicle Classification
            </label>
            <select
              className="flex h-9 w-full rounded-lg border border-[#E5EAF0] bg-white px-3 py-1.5 text-sm text-[#172033] focus:border-[#2563EB] focus:outline-none"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            >
              <option value="truck">Commercial Truck</option>
              <option value="van">Delivery Van</option>
              <option value="car">Sedan / Fleet Car</option>
              <option value="motorcycle">Motorcycle / Express Courier</option>
            </select>
          </div>

          <Input
            label="Driver Contact Phone"
            placeholder="e.g. +1 (555) 019-2834"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />

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
              Register Vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

