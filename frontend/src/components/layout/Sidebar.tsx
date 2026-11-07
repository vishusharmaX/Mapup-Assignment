import React from 'react'
import {
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  Truck,
  BellRing,
  History,
  Settings,
  Radio,
} from 'lucide-react'
import { cn } from '../../utils/cn'

export type NavTab =
  | 'overview'
  | 'tracking'
  | 'geofences'
  | 'vehicles'
  | 'alerts'
  | 'violations'
  | 'settings'

interface SidebarProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  wsConnected: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  wsConnected,
}) => {
  const navItems: Array<{
    id: NavTab
    label: string
    icon: React.ElementType
    badge?: string
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tracking', label: 'Live Tracking', icon: MapPin },
    { id: 'geofences', label: 'Geofences', icon: ShieldAlert },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'alerts', label: 'Alert Rules', icon: BellRing },
    { id: 'violations', label: 'Violation History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-[#101B2D] border-r border-[#17243A] text-white flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#17243A] gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0F9D8A] flex items-center justify-center shadow-md">
            <Radio className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              FleetPulse
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-[#0F9D8A]/20 text-[#0F9D8A] border border-[#0F9D8A]/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-[#667085]">Fleet & Geofence Intelligence</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            Platform
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left',
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#17243A]'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isActive ? 'text-white' : 'text-[#667085]'
                  )}
                />
                <span className="flex-1">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#17243A] bg-[#0C1523]/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94A3B8] flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                wsConnected ? 'bg-[#16A36A] animate-pulse' : 'bg-[#DC4C4C]'
              )}
            />
            {wsConnected ? 'Stream Live' : 'Disconnected'}
          </span>
          <span className="text-[10px] text-[#667085] font-mono">v1.0.0</span>
        </div>
        <p className="text-[11px] text-[#667085] mt-1 truncate">
          PostGIS Engine: SRID 4326
        </p>
      </div>
    </aside>
  )
}
