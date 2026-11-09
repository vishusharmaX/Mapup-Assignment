import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { MapPin, ShieldAlert } from 'lucide-react'
import { CategoryBadge } from '../ui/badge'

interface FrequentGeofencesCardProps {
  geofences: Array<{
    geofence_id: string
    name: string
    category: string
    count: number
  }>
}

export const FrequentGeofencesCard: React.FC<FrequentGeofencesCardProps> = ({
  geofences,
}) => {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#0F9D8A]" />
          Most Frequently Triggered Zones
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {geofences.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#667085]">
            <ShieldAlert className="h-6 w-6 text-[#94A3B8] mx-auto mb-1.5" />
            No boundary triggers recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {geofences.map((g, idx) => (
              <div
                key={g.geofence_id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-[#172033] font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-[#172033] truncate max-w-[160px]">
                      {g.name}
                    </div>
                    <CategoryBadge category={g.category} />
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-[#2563EB]">
                    {g.count}
                  </span>
                  <span className="text-[10px] text-[#667085] ml-1">events</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

