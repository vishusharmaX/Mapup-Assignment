import React from 'react'
import { Menu, RefreshCw, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'

interface TopbarProps {
  currentTabName: string
  onToggleMobileMenu: () => void
  wsStatus: 'connected' | 'connecting' | 'disconnected'
  onRefresh?: () => void
  isRefreshing?: boolean
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTabName,
  onToggleMobileMenu,
  wsStatus,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#E5EAF0] px-4 sm:px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#667085] hover:bg-[#F5F7FA] hover:text-[#172033]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
            {currentTabName}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Stream Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5EAF0] bg-[#F5F7FA] text-xs">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              wsStatus === 'connected' && 'bg-[#16A36A] animate-pulse',
              wsStatus === 'connecting' && 'bg-[#E9A23B] animate-ping',
              wsStatus === 'disconnected' && 'bg-[#DC4C4C]'
            )}
          />
          <span className="font-medium text-[#172033]">
            {wsStatus === 'connected'
              ? 'Real-Time Connected'
              : wsStatus === 'connecting'
              ? 'Reconnecting...'
              : 'Stream Offline'}
          </span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}

        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#0F9D8A] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-mono">
          <Zap className="h-3.5 w-3.5" />
          <span>PostGIS Active</span>
        </div>
      </div>
    </header>
  )
}
