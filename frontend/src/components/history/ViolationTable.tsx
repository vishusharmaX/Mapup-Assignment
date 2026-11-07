import React, { useState } from 'react'
import {
  History,
  Filter,
  MapPin,
} from 'lucide-react'
import { Button } from '../ui/button'
import { CategoryBadge, EventBadge } from '../ui/badge'
import { formatCoordinates, formatDateTime } from '../../utils/formatters'
import type { Violation, Geofence, Vehicle } from '../../types'
import { ViolationMapModal } from './ViolationMapModal'

interface ViolationTableProps {
  violations: Violation[]
  totalCount: number
  isLoading: boolean
  vehicles: Vehicle[]
  geofences: Geofence[]
  onFilterChange: (filters: {
    vehicleId?: string
    geofenceId?: string
    eventType?: string
    startDate?: string
    endDate?: string
  }) => void
}

export const ViolationTable: React.FC<ViolationTableProps> = ({
  violations,
  totalCount,
  isLoading,
  vehicles,
  geofences,
  onFilterChange,
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [selectedGeofence, setSelectedGeofence] = useState<string>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [inspectViolation, setInspectViolation] = useState<Violation | null>(null)

  const applyFilters = (
    v = selectedVehicle,
    g = selectedGeofence,
    e = selectedEventType,
    s = startDate,
    end = endDate
  ) => {
    onFilterChange({
      vehicleId: v === 'all' ? undefined : v,
      geofenceId: g === 'all' ? undefined : g,
      eventType: e === 'all' ? undefined : e,
      startDate: s || undefined,
      endDate: end || undefined,
    })
  }

  const handleResetFilters = () => {
    setSelectedVehicle('all')
    setSelectedGeofence('all')
    setSelectedEventType('all')
    setStartDate('')
    setEndDate('')
    onFilterChange({})
  }

  const matchedGeofence = inspectViolation
    ? geofences.find((g) => g.id === inspectViolation.geofence_id)
    : null

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5EAF0] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#172033]">
            <Filter className="h-4 w-4 text-[#2563EB]" />
            <span>Filter Historical Events</span>
            <span className="text-[11px] font-normal text-[#667085]">
              ({totalCount} records indexed)
            </span>
          </div>
          {(selectedVehicle !== 'all' ||
            selectedGeofence !== 'all' ||
            selectedEventType !== 'all' ||
            startDate ||
            endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs px-2 text-[#DC4C4C]"
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Vehicle filter */}
          <div>
            <label className="text-[11px] text-[#667085] block mb-1">Vehicle</label>
            <select
              className="h-8 text-xs w-full rounded-lg border border-[#E5EAF0] px-2 bg-[#F5F7FA] text-[#172033]"
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value)
                applyFilters(e.target.value, selectedGeofence, selectedEventType, startDate, endDate)
              }}
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.driver_name})
                </option>
              ))}
            </select>
          </div>

          {/* Geofence filter */}
          <div>
            <label className="text-[11px] text-[#667085] block mb-1">Geofence</label>
            <select
              className="h-8 text-xs w-full rounded-lg border border-[#E5EAF0] px-2 bg-[#F5F7FA] text-[#172033]"
              value={selectedGeofence}
              onChange={(e) => {
                setSelectedGeofence(e.target.value)
                applyFilters(selectedVehicle, e.target.value, selectedEventType, startDate, endDate)
              }}
            >
              <option value="all">All Geofences</option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event type filter */}
          <div>
            <label className="text-[11px] text-[#667085] block mb-1">Event Transition</label>
            <select
              className="h-8 text-xs w-full rounded-lg border border-[#E5EAF0] px-2 bg-[#F5F7FA] text-[#172033]"
              value={selectedEventType}
              onChange={(e) => {
                setSelectedEventType(e.target.value)
                applyFilters(selectedVehicle, selectedGeofence, e.target.value, startDate, endDate)
              }}
            >
              <option value="all">All Transitions</option>
              <option value="entry">Entry Events Only</option>
              <option value="exit">Exit Events Only</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-[11px] text-[#667085] block mb-1">Start Date</label>
            <input
              type="date"
              className="h-8 text-xs w-full rounded-lg border border-[#E5EAF0] px-2 bg-[#F5F7FA] text-[#172033]"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                applyFilters(selectedVehicle, selectedGeofence, selectedEventType, e.target.value, endDate)
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[11px] text-[#667085] block mb-1">End Date</label>
            <input
              type="date"
              className="h-8 text-xs w-full rounded-lg border border-[#E5EAF0] px-2 bg-[#F5F7FA] text-[#172033]"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                applyFilters(selectedVehicle, selectedGeofence, selectedEventType, startDate, e.target.value)
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F7FA] border-b border-[#E5EAF0] text-[#667085] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Event Timestamp</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Transition</th>
                <th className="py-3 px-4">Triggered Geofence</th>
                <th className="py-3 px-4">GPS Position</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#667085]">
                    <History className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="font-medium text-[#172033]">No historical violation records found</p>
                    <p className="text-[11px] mt-0.5">
                      Violations and geofence transitions recorded during vehicle movement will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                violations.map((vio) => (
                  <tr
                    key={vio.id}
                    className="hover:bg-[#F5F7FA]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-[#172033]">
                      {formatDateTime(vio.timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172033]">{vio.vehicle_number}</div>
                      <div className="text-[11px] text-[#667085]">{vio.driver_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <EventBadge eventType={vio.event_type} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#172033]">{vio.geofence_name}</div>
                      {vio.category && (
                        <div className="mt-0.5">
                          <CategoryBadge category={vio.category} />
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#667085]">
                      {formatCoordinates(vio.latitude, vio.longitude)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectViolation(vio)}
                        className="h-8 w-8 p-0 text-[#2563EB] hover:bg-blue-50"
                        title="View Incident On Map"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Inspection Modal */}
      <ViolationMapModal
        violation={inspectViolation}
        geofence={matchedGeofence}
        isOpen={inspectViolation !== null}
        onClose={() => setInspectViolation(null)}
      />
    </div>
  )
}
