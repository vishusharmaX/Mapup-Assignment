import React, { useState } from 'react'
import {
  Search,
  Filter,
  Trash2,
  MapPin,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { CategoryBadge } from '../ui/badge'
import { formatDateTime } from '../../utils/formatters'
import type { Geofence } from '../../types'

interface GeofenceTableProps {
  geofences: Geofence[]
  isLoading: boolean
  onDelete: (id: string) => Promise<any>
  onToggleActive?: (id: string, active: boolean) => void
  onSelectGeofence?: (geofence: Geofence) => void
}

export const GeofenceTable: React.FC<GeofenceTableProps> = ({
  geofences,
  isLoading,
  onDelete,
  onSelectGeofence,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredGeofences = geofences.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory =
      selectedCategory === 'all' || g.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete geofence "${name}"? This action cannot be undone.`)) {
      setDeletingId(id)
      try {
        await onDelete(id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E5EAF0]">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <Input
            placeholder="Search geofences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#667085]" />
          <select
            className="h-9 text-xs rounded-lg border border-[#E5EAF0] px-3 bg-[#F5F7FA] font-medium text-[#172033] focus:outline-none focus:border-[#2563EB]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="delivery_zone">Delivery Zones</option>
            <option value="restricted_zone">Restricted Zones</option>
            <option value="toll_zone">Toll Zones</option>
            <option value="customer_area">Customer Areas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FA] border-b border-[#E5EAF0] text-[#667085] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Name & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vertices</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredGeofences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    <ShieldAlert className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="font-medium text-[#172033]">No geofences found</p>
                    <p className="text-[11px] mt-0.5">
                      {searchTerm || selectedCategory !== 'all'
                        ? 'Try adjusting your search criteria or category filter.'
                        : 'Click "Create Geofence" to add your first spatial perimeter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGeofences.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-[#F5F7FA]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172033]">{g.name}</div>
                      {g.description && (
                        <div className="text-[11px] text-[#667085] truncate max-w-xs">
                          {g.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={g.category} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#667085]">
                      {g.coordinates?.length || 0} pts
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          g.is_active
                            ? 'bg-emerald-50 text-[#16A36A] border border-emerald-200'
                            : 'bg-slate-100 text-[#667085]'
                        }`}
                      >
                        {g.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#667085]">
                      {formatDateTime(g.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {onSelectGeofence && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectGeofence(g)}
                          className="h-8 w-8 p-0"
                          title="View on Map"
                        >
                          <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(g.id, g.name)}
                        isLoading={deletingId === g.id}
                        className="h-8 w-8 p-0 text-[#DC4C4C] hover:text-[#DC4C4C] hover:bg-red-50"
                        title="Delete Geofence"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
