import React from 'react'
import { X, Radio } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { NavTab } from './Sidebar'
import {
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  Truck,
  BellRing,
  History,
  Settings,
} from 'lucide-react'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
}) => {
  if (!isOpen) return null

  const navItems: Array<{
    id: NavTab
    label: string
    icon: React.ElementType
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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#101B2D]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#101B2D] p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-[#17243A]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#0F9D8A] flex items-center justify-center">
                <Radio className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">FleetPulse</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#667085] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id)
                    onClose()
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors',
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#17243A]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-xs text-[#667085] pt-4 border-t border-[#17243A]">
          FleetPulse Intelligent Operations
        </div>
      </div>
    </div>
  )
}

