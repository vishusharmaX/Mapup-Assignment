import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { WebSocketAlertEvent } from '../types'

const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:' ? 'wss:' : 'ws:') +
    '//' +
    (import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).host
      : window.location.hostname + ':8080') +
    '/ws/alerts'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export function useWebSocket(onEventReceived?: (event: WebSocketAlertEvent) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [latestEvent, setLatestEvent] = useState<WebSocketAlertEvent | null>(null)
  const [eventFeed, setEventFeed] = useState<WebSocketAlertEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeout = useRef<number | null>(null)
  const callbackRef = useRef(onEventReceived)

  useEffect(() => {
    callbackRef.current = onEventReceived
  }, [onEventReceived])

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    setStatus('connecting')

    try {
      const ws = new WebSocket(WS_BASE_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          // Parse lines in case multiple messages arrived in single frame
          const lines = event.data.split('\n')
          for (const line of lines) {
            if (!line.trim()) continue
            const alertEvent: WebSocketAlertEvent = JSON.parse(line)

            setLatestEvent(alertEvent)
            setEventFeed((prev) => [alertEvent, ...prev.slice(0, 49)])

            if (callbackRef.current) {
              callbackRef.current(alertEvent)
            }

            // Trigger Toast Notification with rich alert styling
            const isEntry = alertEvent.event_type === 'entry'
            const isRestricted = alertEvent.geofence.category === 'restricted_zone'

            if (isRestricted) {
              toast.error(`SECURITY ALERT: ${alertEvent.vehicle.vehicle_number} ENTERED RESTRICTED ZONE`, {
                description: `${alertEvent.vehicle.driver_name} entered '${alertEvent.geofence.geofence_name}'`,
                duration: 6000,
              })
            } else if (isEntry) {
              toast.info(`Geofence Entry: ${alertEvent.vehicle.vehicle_number}`, {
                description: `Entered '${alertEvent.geofence.geofence_name}' (${alertEvent.geofence.category})`,
                duration: 4500,
              })
            } else {
              toast.warning(`Geofence Exit: ${alertEvent.vehicle.vehicle_number}`, {
                description: `Exited '${alertEvent.geofence.geofence_name}'`,
                duration: 4500,
              })
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        wsRef.current = null

        // Exponential backoff reconnect: 1s, 2s, 4s, 8s, up to 15s max
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000)
        reconnectAttempts.current += 1

        reconnectTimeout.current = window.setTimeout(() => {
          connect()
        }, timeout)
      }

      ws.onerror = (error) => {
        console.warn('WebSocket encountered error:', error)
        ws.close()
      }
    } catch (err) {
      console.error('WebSocket connection initialization error:', err)
      setStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    status,
    latestEvent,
    eventFeed,
    reconnect: connect,
  }
}
