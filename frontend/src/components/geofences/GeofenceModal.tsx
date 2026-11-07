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
import { PolygonDrawer } from '../map/PolygonDrawer'
import type { Coordinate, GeofenceCategory } from '../../types'

interface GeofenceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    description?: string
    category: GeofenceCategory
    coordinates: Coordinate[]
  }) => Promise<any>
}

export const GeofenceModal: React.FC<GeofenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GeofenceCategory>('delivery_zone')
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Geofence name is required')
      return
    }

    if (coordinates.length < 3) {
      setError('Please plot at least 3 points on the map to define the polygon boundary')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        coordinates,
      })
      // Reset form
      setName('')
      setDescription('')
      setCategory('delivery_zone')
      setCoordinates([])
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create geofence')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Define New Geofence</DialogTitle>
          <DialogDescription>
            Specify polygon boundaries, classification category, and operational parameters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-[#DC4C4C] border border-red-200 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Geofence Name"
              placeholder="e.g. SFO Cargo Terminal North"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#172033] block">
                Category
              </label>
              <select
                className="flex h-9 w-full rounded-lg border border-[#E5EAF0] bg-white px-3 py-1.5 text-sm text-[#172033] focus:border-[#2563EB] focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value as GeofenceCategory)}
              >
                <option value="delivery_zone">Delivery Zone</option>
                <option value="restricted_zone">Restricted Zone</option>
                <option value="toll_zone">Toll Zone</option>
                <option value="customer_area">Customer Area</option>
              </select>
            </div>
          </div>

          <Input
            label="Description (Optional)"
            placeholder="Operational notes or rules for this geographical boundary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Interactive Polygon Drawer */}
          <div className="pt-2">
            <label className="text-xs font-medium text-[#172033] block mb-1">
              Interactive Boundary Definition
            </label>
            <PolygonDrawer
              initialCoordinates={coordinates}
              onChange={(pts) => setCoordinates(pts)}
            />
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
              Create Geofence
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
