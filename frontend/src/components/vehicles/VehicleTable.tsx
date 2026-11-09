import React, { useState } from 'react'
import {
  Search,
  Filter,
  Trash2,
  MapPin,
  Truck,
  Phone,
  User,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { StatusBadge } from '../ui/badge'
import { formatCoordinates, formatTimeAgo } from '../../utils/formatters'
import type { Vehicle } from '../../types'

interface VehicleTableProps {
  vehicles: Vehicle[]
  isLoading: boolean
  onDelete: (id: string) => Promise<any>
  onSelectVehicle?: (vehicle: Vehicle) => void
}

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  isLoading,
  onDelete,
  onSelectVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone_number.includes(searchTerm)
    const matchesType = typeFilter === 'all' || v.vehicle_type === typeFilter
    return matchesSearch && matchesType
  })

  const handleDelete = async (id: string, number: string) => {
    if (confirm(`Are you sure you want to delete vehicle "${number}"? Location history will also be removed.`)) {
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
            placeholder="Search by number, driver, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#667085]" />
          <select
            className="h-9 text-xs rounded-lg border border-[#E5EAF0] px-3 bg-[#F5F7FA] font-medium text-[#172033] focus:outline-none focus:border-[#2563EB]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Vehicle Types</option>
            <option value="truck">Trucks</option>
            <option value="van">Vans</option>
            <option value="car">Cars</option>
            <option value="motorcycle">Motorcycles</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FA] border-b border-[#E5EAF0] text-[#667085] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Known Position</th>
                <th className="py-3 px-4">Last Ping</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#667085]">
                    <Truck className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="font-medium text-[#172033]">No vehicles registered</p>
                    <p className="text-[11px] mt-0.5">
                      {searchTerm || typeFilter !== 'all'
                        ? 'Try clearing your search or filter.'
                        : 'Click "Register Vehicle" to add a new fleet asset.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-[#F5F7FA]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172033] tracking-tight">
                        {v.vehicle_number}
                      </div>
                      <div className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3 text-[#94A3B8]" />
                        {v.driver_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-[#172033] px-2 py-0.5 bg-[#F5F7FA] rounded border border-[#E5EAF0]">
                        {v.vehicle_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#667085]">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#94A3B8]" />
                        {v.phone_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#172033]">
                      {v.last_latitude != null && v.last_longitude != null ? (
                        formatCoordinates(v.last_latitude, v.last_longitude)
                      ) : (
                        <span className="text-[#94A3B8] italic">No GPS received</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#667085]">
                      {formatTimeAgo(v.last_location_time)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {onSelectVehicle && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectVehicle(v)}
                          className="h-8 w-8 p-0"
                          title="Track & Simulate"
                        >
                          <MapPin className="h-3.5 w-3.5 text-[#2563EB]" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(v.id, v.vehicle_number)}
                        isLoading={deletingId === v.id}
                        className="h-8 w-8 p-0 text-[#DC4C4C] hover:text-[#DC4C4C] hover:bg-red-50"
                        title="Delete Vehicle"
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

