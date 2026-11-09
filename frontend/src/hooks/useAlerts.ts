import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAlertRules,
  configureAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from '../services/api'
import type { AlertEventType } from '../types'
import { toast } from 'sonner'

export function useAlerts(geofenceId?: string, vehicleId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['alerts', geofenceId, vehicleId],
    queryFn: () => getAlertRules(geofenceId, vehicleId),
    staleTime: 30000,
  })

  const configureMutation = useMutation({
    mutationFn: (data: {
      geofence_id: string
      vehicle_id?: string | null
      event_type: AlertEventType
      is_active?: boolean
    }) => configureAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Alert rule configured successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to configure alert rule')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Alert rule removed')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete alert rule')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleAlertRule(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert rule status updated')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update alert rule')
    },
  })

  return {
    alerts: query.data?.alerts || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    timeNs: query.data?.time_ns,
    configureAlert: configureMutation.mutateAsync,
    isConfiguring: configureMutation.isPending,
    deleteAlert: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    toggleAlert: toggleMutation.mutateAsync,
  }
}

