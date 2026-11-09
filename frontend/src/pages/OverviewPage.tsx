import React from 'react'
import {
  Truck,
  Activity,
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  MapPin,
  BellRing,
} from 'lucide-react'
import { KpiCard } from '../components/dashboard/KpiCard'
import { FleetStatusDistribution } from '../components/dashboard/FleetStatusDistribution'
import { RecentEventsFeed } from '../components/dashboard/RecentEventsFeed'
import { FrequentGeofencesCard } from '../components/dashboard/FrequentGeofencesCard'
import { Button } from '../components/ui/button'
import { useStats } from '../hooks/useStats'
import type { NavTab } from '../components/layout/Sidebar'

interface OverviewPageProps {
  onNavigate: (tab: NavTab) => void
  onOpenNewVehicle: () => void
  onOpenNewGeofence: () => void
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onOpenNewVehicle,
  onOpenNewGeofence,
}) => {
  const { stats, isLoading } = useStats()

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E5EAF0] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight">
            Fleet Operations Overview
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Real-time geospatial monitoring, active perimeters, and boundary transition telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('tracking')}
            className="text-xs"
          >
            <MapPin className="h-3.5 w-3.5 mr-1" />
            Launch Live Map
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenNewVehicle}
            className="text-xs"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1 text-[#2563EB]" />
            Add Vehicle
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenNewGeofence}
            className="text-xs"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1 text-[#0F9D8A]" />
            Draw Geofence
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Fleet Vehicles"
          value={isLoading ? '...' : stats?.total_vehicles ?? 0}
          icon={Truck}
          subtext="Monitored road assets"
          color="blue"
        />
        <KpiCard
          title="Active Vehicles"
          value={isLoading ? '...' : stats?.active_vehicles ?? 0}
          icon={Activity}
          subtext={`${stats?.idle_vehicles ?? 0} idle, ${stats?.offline_vehicles ?? 0} offline`}
          color="teal"
        />
        <KpiCard
          title="Active Geofences"
          value={isLoading ? '...' : stats?.total_geofences ?? 0}
          icon={ShieldAlert}
          subtext="PostGIS SRID 4326 perimeters"
          color="amber"
        />
        <KpiCard
          title="Total Violations Logged"
          value={isLoading ? '...' : stats?.total_violations ?? 0}
          icon={AlertTriangle}
          subtext={`${stats?.active_alert_rules ?? 0} active alert rules`}
          color="red"
        />
      </div>

      {/* Middle Grid: Fleet Status & Top Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FleetStatusDistribution
            active={stats?.active_vehicles ?? 0}
            idle={stats?.idle_vehicles ?? 0}
            offline={stats?.offline_vehicles ?? 0}
            total={stats?.total_vehicles ?? 0}
          />
        </div>

        <div className="lg:col-span-2">
          <RecentEventsFeed
            events={stats?.recent_events ?? []}
            onViewAll={() => onNavigate('violations')}
          />
        </div>
      </div>

      {/* Bottom Grid: Frequent Geofences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FrequentGeofencesCard
          geofences={stats?.frequent_geofences ?? []}
        />

        {/* Operational Guidelines Card */}
        <div className="bg-[#101B2D] text-white p-5 rounded-xl border border-[#17243A] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F9D8A] uppercase tracking-wider mb-2">
              <BellRing className="h-4 w-4" />
              Automated Alert Architecture
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Instant Point-in-Polygon Geofencing
            </h3>
            <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
              Every coordinate ping to <code className="text-[#0F9D8A] font-mono">POST /vehicles/location</code> evaluates PostGIS <code className="text-[#0F9D8A] font-mono">ST_Covers</code> against all active polygons, comparing previous state to identify real-time outside-to-inside (entry) and inside-to-outside (exit) transitions with sub-millisecond latency.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-[#17243A] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>WebSocket Broadcast: <strong className="text-white">/ws/alerts</strong></span>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-[#2563EB] hover:text-white font-medium hover:underline"
            >
              Configure Rules &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

