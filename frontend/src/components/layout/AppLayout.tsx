import React, { useState } from 'react'
import { Sidebar, type NavTab } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { OverviewPage } from '../../pages/OverviewPage'
import { LiveTrackingPage } from '../../pages/LiveTrackingPage'
import { GeofencesPage } from '../../pages/GeofencesPage'
import { VehiclesPage } from '../../pages/VehiclesPage'
import { AlertsPage } from '../../pages/AlertsPage'
import { ViolationsPage } from '../../pages/ViolationsPage'
import { SettingsPage } from '../../pages/SettingsPage'
import { VehicleModal } from '../vehicles/VehicleModal'
import { GeofenceModal } from '../geofences/GeofenceModal'
import { useVehicles } from '../../hooks/useVehicles'
import { useGeofences } from '../../hooks/useGeofences'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useQueryClient } from '@tanstack/react-query'

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview')
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const queryClient = useQueryClient()
  const { createVehicle } = useVehicles()
  const { createGeofence } = useGeofences()

  // Real-time WebSocket listener: when alerts arrive, refresh queries automatically
  const { status: wsStatus } = useWebSocket((_event) => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['violations'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  })

  const tabTitles: Record<NavTab, string> = {
    overview: 'Fleet Intelligence Overview',
    tracking: 'Real-Time Geospatial Map & Simulation',
    geofences: 'Geofence Boundaries',
    vehicles: 'Vehicle Assets',
    alerts: 'Alert Rules & Triggers',
    violations: 'Violation Audit History',
    settings: 'System Diagnostics & Configuration',
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.refetchQueries()
    setIsRefreshing(false)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F7FA]">
      {/* Fixed Left Sidebar on Desktop */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          wsConnected={wsStatus === 'connected'}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          currentTabName={tabTitles[currentTab]}
          onToggleMobileMenu={() => setIsMobileNavOpen(true)}
          wsStatus={wsStatus}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'overview' && (
            <OverviewPage
              onNavigate={setCurrentTab}
              onOpenNewVehicle={() => setIsVehicleModalOpen(true)}
              onOpenNewGeofence={() => setIsGeofenceModalOpen(true)}
            />
          )}

          {currentTab === 'tracking' && <LiveTrackingPage />}

          {currentTab === 'geofences' && (
            <GeofencesPage
              onNavigateToTracking={() => setCurrentTab('tracking')}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesPage
              onNavigateToTracking={() => setCurrentTab('tracking')}
            />
          )}

          {currentTab === 'alerts' && <AlertsPage />}

          {currentTab === 'violations' && <ViolationsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Modals for Quick Add */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSubmit={createVehicle}
      />

      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        onSubmit={createGeofence}
      />
    </div>
  )
}

