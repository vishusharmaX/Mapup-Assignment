import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from '../services/api'
import type { Coordinate, GeofenceCategory } from '../types'
import { toast } from 'sonner'

export function useGeofences(category?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['geofences', category],
    queryFn: () => getGeofences(category),
    staleTime: 30000,
  })

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string
      description?: string
      category: GeofenceCategory
      coordinates: Coordinate[]
    }) => createGeofence(data),
    onSuccess: (newGeofence) => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success(`Geofence '${newGeofence.name}' created successfully`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create geofence')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        name: string
        description: string
        category: GeofenceCategory
        coordinates: Coordinate[]
        is_active: boolean
      }>
    }) => updateGeofence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] })
      toast.success('Geofence updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update geofence')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGeofence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Geofence deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete geofence')
    },
  })

  return {
    geofences: query.data?.geofences || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    timeNs: query.data?.time_ns,
    createGeofence: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateGeofence: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteGeofence: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}

