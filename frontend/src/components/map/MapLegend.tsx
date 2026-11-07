import React from 'react'

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-xs p-3.5 rounded-lg border border-[#E5EAF0] shadow-md text-xs space-y-2.5 max-w-[220px]">
      <div className="font-semibold text-[#172033] border-b border-[#E5EAF0] pb-1.5 flex items-center justify-between">
        <span>Map Legend</span>
        <span className="text-[10px] text-[#667085] font-normal">SRID 4326</span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
          Geofence Categories
        </p>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-xs border-2 border-[#DC4C4C] bg-[#DC4C4C]/25"></span>
          <span className="text-[#172033]">Restricted Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-xs border-2 border-[#2563EB] bg-[#2563EB]/25"></span>
          <span className="text-[#172033]">Delivery Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-xs border-2 border-[#E9A23B] bg-[#E9A23B]/25"></span>
          <span className="text-[#172033]">Toll Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-xs border-2 border-[#0F9D8A] bg-[#0F9D8A]/25"></span>
          <span className="text-[#172033]">Customer Area</span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-[#E5EAF0]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
          Vehicle Status
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]"></span>
          <span className="text-[#172033]">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E9A23B]"></span>
          <span className="text-[#172033]">Idle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></span>
          <span className="text-[#172033]">Offline / No GPS</span>
        </div>
      </div>
    </div>
  )
}
