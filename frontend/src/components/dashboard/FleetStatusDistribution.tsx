import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Activity } from 'lucide-react'

interface FleetStatusDistributionProps {
  active: number
  idle: number
  offline: number
  total: number
}

export const FleetStatusDistribution: React.FC<FleetStatusDistributionProps> = ({
  active,
  idle,
  offline,
  total,
}) => {
  const activePct = total > 0 ? (active / total) * 100 : 0
  const idlePct = total > 0 ? (idle / total) * 100 : 0
  const offlinePct = total > 0 ? (offline / total) * 100 : 0

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#2563EB]" />
            Fleet Status Distribution
          </CardTitle>
          <span className="text-xs font-mono text-[#667085]">
            {total} Total Registered
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visual Progress Bar */}
        <div className="h-3 w-full bg-[#E5EAF0] rounded-full overflow-hidden flex">
          <div
            className="bg-[#16A36A] h-full transition-all duration-500"
            style={{ width: `${activePct}%` }}
            title={`Active: ${active}`}
          />
          <div
            className="bg-[#E9A23B] h-full transition-all duration-500"
            style={{ width: `${idlePct}%` }}
            title={`Idle: ${idle}`}
          />
          <div
            className="bg-[#94A3B8] h-full transition-all duration-500"
            style={{ width: `${offlinePct}%` }}
            title={`Offline: ${offline}`}
          />
        </div>

        {/* Legend / Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5EAF0] text-center">
          <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="text-xs text-[#16A36A] font-semibold">Active</div>
            <div className="text-lg font-bold text-[#172033] mt-0.5">{active}</div>
            <div className="text-[10px] text-[#667085]">{activePct.toFixed(0)}%</div>
          </div>

          <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
            <div className="text-xs text-[#E9A23B] font-semibold">Idle</div>
            <div className="text-lg font-bold text-[#172033] mt-0.5">{idle}</div>
            <div className="text-[10px] text-[#667085]">{idlePct.toFixed(0)}%</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-[#667085] font-semibold">Offline</div>
            <div className="text-lg font-bold text-[#172033] mt-0.5">{offline}</div>
            <div className="text-[10px] text-[#667085]">{offlinePct.toFixed(0)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
