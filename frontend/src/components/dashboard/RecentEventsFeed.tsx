import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { BellRing, ShieldAlert } from 'lucide-react'
import { EventBadge, CategoryBadge } from '../ui/badge'
import { formatTimeAgo } from '../../utils/formatters'
import type { Violation } from '../../types'

interface RecentEventsFeedProps {
  events: Violation[]
  onViewAll?: () => void
}

export const RecentEventsFeed: React.FC<RecentEventsFeedProps> = ({
  events,
  onViewAll,
}) => {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[#2563EB]" />
            Recent Geofence Incidents
          </CardTitle>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-[#2563EB] hover:underline font-medium"
            >
              View Full History &rarr;
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#667085]">
            <ShieldAlert className="h-6 w-6 text-[#94A3B8] mx-auto mb-1.5" />
            No geofence events logged yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {events.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 rounded-lg border border-[#E5EAF0] bg-[#F5F7FA]/70 hover:bg-[#F5F7FA] transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <EventBadge eventType={evt.event_type} />
                    <span className="font-bold text-[#172033]">
                      {evt.vehicle_number}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#667085] flex items-center gap-1.5">
                    <span>{evt.geofence_name}</span>
                    {evt.category && <CategoryBadge category={evt.category} />}
                  </div>
                </div>

                <div className="text-[11px] text-[#94A3B8] text-right font-mono">
                  {formatTimeAgo(evt.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
