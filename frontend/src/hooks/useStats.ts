import { useQuery } from '@tanstack/react-query'
import { getOverviewStats } from '../services/api'

export function useStats() {
  const query = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: getOverviewStats,
    staleTime: 10000,
    refetchInterval: 15000,
  })

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    timeNs: query.data?.time_ns,
  }
}
