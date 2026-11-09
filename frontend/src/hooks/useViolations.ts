import { useQuery } from '@tanstack/react-query'
import { getViolationsHistory } from '../services/api'

export interface UseViolationsParams {
  vehicleId?: string
  geofenceId?: string
  eventType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export function useViolations(params: UseViolationsParams = {}) {
  const query = useQuery({
    queryKey: ['violations', params],
    queryFn: () =>
      getViolationsHistory({
        vehicle_id: params.vehicleId,
        geofence_id: params.geofenceId,
        event_type: params.eventType,
        start_date: params.startDate,
        end_date: params.endDate,
        limit: params.limit || 50,
        offset: params.offset || 0,
      }),
    staleTime: 15000,
  })

  return {
    violations: query.data?.violations || [],
    totalCount: query.data?.total_count || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    timeNs: query.data?.time_ns,
  }
}

