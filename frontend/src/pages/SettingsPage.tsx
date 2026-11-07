import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getHealth } from '../services/api'
import { CheckCircle2, RefreshCw, Server, Database, Radio, Globe } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<{ status: string; database: string; time_ns?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const data = await getHealth()
      setHealth(data)
    } catch {
      setHealth({ status: 'unreachable', database: 'disconnected' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E5EAF0] shadow-xs">
        <h2 className="text-xl font-bold text-[#172033] tracking-tight">
          System Diagnostics & Technical Specifications
        </h2>
        <p className="text-xs text-[#667085] mt-1">
          Verify backend API connectivity, PostGIS geospatial engine health, and architectural parameters.
        </p>
      </div>

      {/* Health Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="h-4 w-4 text-[#2563EB]" />
              Backend API & PostGIS Health
            </CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={checkStatus}
              isLoading={loading}
              className="text-xs h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Re-check Status
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] flex items-center justify-between">
              <span className="text-[#667085]">API Service:</span>
              <span className="font-semibold flex items-center gap-1.5 text-[#16A36A]">
                <CheckCircle2 className="h-4 w-4" />
                {health?.status === 'healthy' ? 'Healthy & Running' : 'Offline'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] flex items-center justify-between">
              <span className="text-[#667085]">PostgreSQL + PostGIS:</span>
              <span className="font-semibold flex items-center gap-1.5 text-[#16A36A]">
                <Database className="h-4 w-4" />
                {health?.database === 'connected' ? 'Connected (PostGIS 3.4)' : health?.database || 'Pending'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] flex items-center justify-between">
              <span className="text-[#667085]">API Base URL:</span>
              <span className="font-mono text-[11px] text-[#172033]">
                {import.meta.env.VITE_API_URL || 'http://localhost:8080'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] flex items-center justify-between">
              <span className="text-[#667085]">Execution Benchmark:</span>
              <span className="font-mono text-[11px] text-[#2563EB] font-bold">
                {health?.time_ns ? `${(parseInt(health.time_ns) / 1000).toFixed(2)} µs` : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geospatial Conventions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#0F9D8A]" />
            Geospatial Standards & Convention Guarantees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs leading-relaxed text-[#667085]">
          <div className="p-3 rounded-lg border border-[#E5EAF0] bg-slate-50 space-y-2">
            <div className="font-semibold text-[#172033] flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-[#0F9D8A]" />
              Coordinate Convention:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#667085]">
              <li><strong>Frontend & API:</strong> Coordinates are serialized as <code className="font-mono text-[#101B2D]">[latitude, longitude]</code> array.</li>
              <li><strong>PostGIS Storage:</strong> Stored using WGS84 EPSG:4326 via <code className="font-mono text-[#101B2D]">ST_MakePoint(longitude, latitude)</code> with explicit longitude-first transposition.</li>
              <li><strong>Boundary Policy:</strong> Evaluated using PostGIS <code className="font-mono text-[#101B2D]">ST_Covers(geom, ST_SetSRID(ST_MakePoint(lon, lat), 4326))</code>. Boundary vertices are strictly treated as covered.</li>
              <li><strong>Nanosecond Response Header:</strong> Every API response contains an exact execution benchmark field <code className="font-mono text-[#101B2D]">"time_ns"</code> measured in Go.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
