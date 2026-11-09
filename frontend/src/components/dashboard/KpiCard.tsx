import React from 'react'
import { Card } from '../ui/card'
import { cn } from '../../utils/cn'

interface KpiCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  subtext?: string
  trend?: string
  color?: 'blue' | 'teal' | 'red' | 'amber' | 'slate'
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  color = 'blue',
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-[#2563EB] border-blue-200',
    teal: 'bg-emerald-50 text-[#0F9D8A] border-emerald-200',
    red: 'bg-red-50 text-[#DC4C4C] border-red-200',
    amber: 'bg-amber-50 text-[#E9A23B] border-amber-200',
    slate: 'bg-slate-50 text-[#667085] border-slate-200',
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#667085] uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-[#172033] mt-1 tracking-tight">
            {value}
          </h3>
          {subtext && (
            <p className="text-[11px] text-[#667085] mt-0.5">{subtext}</p>
          )}
        </div>
        <div
          className={cn(
            'h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs',
            colorMap[color]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

