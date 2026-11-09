import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleLocation,
} from '../services/api'
import type { VehicleType } from '../types'
import { toast } from 'sonner'

export function useVehicles() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
    staleTime: 10000,
    refetchInterval: 15000, // Background refresh
  })

  const createMutation = useMutation({
    mutationFn: (data: {
      vehicle_number: string
      driver_name: string
      vehicle_type: VehicleType
      phone_number: string
    }) => createVehicle(data),
    onSuccess: (newVeh) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success(`Vehicle ${newVeh.vehicle_number} registered`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to register vehicle')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        vehicle_number: string
        driver_name: string
        vehicle_type: VehicleType
        phone_number: string
        status: string
      }>
    }) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Vehicle updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update vehicle')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast.success('Vehicle deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete vehicle')
    },
  })

  const locationMutation = useMutation({
    mutationFn: (data: {
      vehicle_id: string
      latitude: number
      longitude: number
      timestamp?: string
    }) => updateVehicleLocation(data),
    onSuccess: (resp) => {
      // Optimistically update vehicle in cache
      queryClient.setQueryData(['vehicles'], (old: any) => {
        if (!old || !old.vehicles) return old
        return {
          ...old,
          vehicles: old.vehicles.map((v: any) =>
            v.id === resp.vehicle_id
              ? {
                  ...v,
                  last_latitude: resp.latitude,
                  last_longitude: resp.longitude,
                  last_location_time: resp.timestamp,
                  status: 'active',
                }
              : v
          ),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['violations'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update vehicle location')
    },
  })

  return {
    vehicles: query.data?.vehicles || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    timeNs: query.data?.time_ns,
    createVehicle: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateVehicle: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteVehicle: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateLocation: locationMutation.mutateAsync,
    isUpdatingLocation: locationMutation.isPending,
  }
}

