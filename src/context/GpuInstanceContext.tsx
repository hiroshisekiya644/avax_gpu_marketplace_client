'use client'

import type React from 'react'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getGpuAction } from '@/api/GpuProvider'
import { getUserData } from '@/api/User'
import { initializeSocket, joinUserRoom } from '@/utils/socket'
import { Snackbar } from '@/components/snackbar/SnackBar'

// Define the flavor features interface
interface FlavorFeatures {
  network_optimised: boolean
  no_hibernation: boolean
  no_snapshot: boolean
  local_storage_only: boolean
}

// Define the GPU instance type based on the API response
interface GpuInstance {
  id: number
  user_id: number
  flavor_name: string
  region: string
  instance_id: number | string
  gpu_name: string
  hyperstack_gpu_name: string
  status: string
  flavor_features: FlavorFeatures
  startedAt: string
  is_deleted: boolean
  deleted_at: string | null
  createdAt: string
  updatedAt: string
  public_ip?: string | null
}

// Define the structure of the data received from the socket
interface GpuStatusUpdate {
  instance_id: number | string
  status: string
  public_ip?: string | null
}

interface GpuInstanceContextType {
  instances: GpuInstance[]
  isLoading: boolean
  error: string | null
  refreshInstances: () => Promise<void>
  getInstance: (id: string) => GpuInstance | null
}

const GpuInstanceContext = createContext<GpuInstanceContextType | undefined>(undefined)

export const GpuInstanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<GpuInstance[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

  // Fetch user data to get the user ID
  const fetchUserData = useCallback(async () => {
    try {
      const response = await getUserData()
      if (response && response.user) {
        setUserId(response.user.id)
        return response.user.id
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
    return null
  }, [])

  // Fetch GPU instances
  const fetchGpuInstances = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getGpuAction()

      if (response && response.status === 'success') {
        // Handle both array and single object responses
        const gpuData = Array.isArray(response.gpu) ? response.gpu : [response.gpu]

        // Process the data to convert BUILD status to CREATING
        const processedData = gpuData.map((instance) => ({
          ...instance,
          status: instance.status === 'BUILD' ? 'CREATING' : instance.status
        }))

        // Sort instances by creation date (newest first)
        const sortedInstances = [...processedData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setInstances(sortedInstances)
      } else {
        setError('Failed to fetch GPU instances')
      }
    } catch (err) {
      console.error('Error fetching GPU instances:', err)
      setError('Failed to fetch GPU instances. Please try again.')
      Snackbar({ message: 'Failed to fetch GPU instances', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize socket connection and join user room
  const setupSocket = useCallback(async () => {
    try {
      // Get user ID if not already set
      const currentUserId = userId || (await fetchUserData())
      if (!currentUserId) return undefined

      // Initialize socket and join user room
      const socket = initializeSocket()
      joinUserRoom(currentUserId)

      // Listen for GPU status updates
      socket.on('gpuStatusUpdate', (rawData: unknown) => {
        // Type guard function to validate the data structure
        const isValidStatusUpdate = (data: unknown): data is GpuStatusUpdate => {
          return (
            typeof data === 'object' &&
            data !== null &&
            'instance_id' in data &&
            'status' in data &&
            typeof (data as GpuStatusUpdate).status === 'string'
          )
        }

        // Validate the data before processing
        if (!isValidStatusUpdate(rawData)) {
          console.error('Invalid GPU status update data:', rawData)
          return
        }

        // Now TypeScript knows data is a GpuStatusUpdate
        const data: GpuStatusUpdate = rawData

        // Update the specific instance in the state without refetching everything
        setInstances((prevInstances) => {
          return prevInstances.map((instance) => {
            if (instance.instance_id.toString() === data.instance_id.toString()) {
              // Create updated instance with new status
              const updatedInstance: GpuInstance = {
                ...instance,
                status: data.status === 'BUILD' ? 'CREATING' : data.status,
                ...(data.public_ip !== undefined && { public_ip: data.public_ip })
              }

              return updatedInstance
            }
            return instance
          })
        })
      })

      // Return a cleanup function
      return () => {
        socket.off('gpuStatusUpdate')
      }
    } catch (error) {
      console.error('Error setting up socket:', error)
      return undefined
    }
  }, [userId, fetchUserData])

  // Get a specific instance by ID
  const getInstance = useCallback(
    (id: string) => {
      return (
        instances.find((instance) => instance.id.toString() === id || instance.instance_id.toString() === id) || null
      )
    },
    [instances]
  )

  // Initial setup
  useEffect(() => {
    fetchGpuInstances()

    // Set up socket connection
    let cleanupFn: (() => void) | undefined

    setupSocket().then((cleanup) => {
      cleanupFn = cleanup
    })

    // Clean up the socket listeners when the component unmounts
    return () => {
      if (cleanupFn) {
        cleanupFn()
      }
    }
  }, [fetchGpuInstances, setupSocket])

  const value = {
    instances,
    isLoading,
    error,
    refreshInstances: fetchGpuInstances,
    getInstance
  }

  return <GpuInstanceContext.Provider value={value}>{children}</GpuInstanceContext.Provider>
}

export const useGpuInstances = () => {
  const context = useContext(GpuInstanceContext)
  if (context === undefined) {
    throw new Error('useGpuInstances must be used within a GpuInstanceProvider')
  }
  return context
}
