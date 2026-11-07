import React, { useState } from 'react'
import { BellRing, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { CategoryBadge, EventBadge } from '../ui/badge'
import { formatDateTime } from '../../utils/formatters'
import type { AlertRule } from '../../types'

interface AlertRuleTableProps {
  alerts: AlertRule[]
  isLoading: boolean
  onDelete: (id: string) => Promise<any>
  onToggleActive: (id: string, active: boolean) => Promise<any>
}

export const AlertRuleTable: React.FC<AlertRuleTableProps> = ({
  alerts,
  isLoading,
  onDelete,
  onToggleActive,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert rule?')) {
      setDeletingId(id)
      try {
        await onDelete(id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleToggle = async (rule: AlertRule) => {
    setTogglingId(rule.id)
    try {
      await onToggleActive(rule.id, !rule.is_active)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F7FA] border-b border-[#E5EAF0] text-[#667085] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Associated Geofence</th>
              <th className="py-3 px-4">Monitored Vehicle</th>
              <th className="py-3 px-4">Trigger Condition</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAF0]">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto"></div></td>
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#667085]">
                  <BellRing className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                  <p className="font-medium text-[#172033]">No alert rules configured</p>
                  <p className="text-[11px] mt-0.5">
                    Configure alert rules to receive automated notifications when vehicles breach or leave geofences.
                  </p>
                </td>
              </tr>
            ) : (
              alerts.map((rule) => (
                <tr
                  key={rule.id}
                  className="hover:bg-[#F5F7FA]/70 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#172033]">
                      {rule.geofence_name || 'Geofence Perimeter'}
                    </div>
                    {rule.category && (
                      <div className="mt-1">
                        <CategoryBadge category={rule.category} />
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {rule.vehicle_number ? (
                      <span className="font-mono font-bold text-[#172033] bg-[#F5F7FA] px-2 py-0.5 rounded border border-[#E5EAF0]">
                        {rule.vehicle_number}
                      </span>
                    ) : (
                      <span className="font-medium text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Global (All Vehicles)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {rule.event_type === 'both' ? (
                      <span className="font-medium text-[#172033] bg-slate-100 px-2.5 py-0.5 rounded-full text-xs border border-slate-200">
                        Entry & Exit
                      </span>
                    ) : (
                      <EventBadge eventType={rule.event_type} />
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggle(rule)}
                      disabled={togglingId === rule.id}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.is_active ? 'bg-[#16A36A]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          rule.is_active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-[#667085]">
                    {formatDateTime(rule.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      isLoading={deletingId === rule.id}
                      className="h-8 w-8 p-0 text-[#DC4C4C] hover:text-[#DC4C4C] hover:bg-red-50"
                      title="Delete Rule"
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
  )
}
