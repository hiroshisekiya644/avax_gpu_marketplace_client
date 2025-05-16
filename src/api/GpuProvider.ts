// Add the import for User type at the top of the file
import axios, { type AxiosResponse } from 'axios'
import type { User } from '@/api/User'

interface GpuResponse {
  data: {
    data: Array<{
      gpu: string
      region_name: string
      flavors: Array<{
        id: number | string
        name: string
        cpu: number
        ram: number
        disk: number
        ephemeral: number
        stock_available: boolean
      }>
    }>
  }
}

export const getAvailableGPUAction = async (): Promise<GpuResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/flavors`

    const token = localStorage.getItem('authToken')

    const result: AxiosResponse<GpuResponse> = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return result.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorMessage = 'An Axios error occurred'
      throw new Error(errorMessage)
    } else if (error instanceof Error) {
      throw new Error(error.message || 'An unknown error occurred')
    } else {
      throw new Error('An unexpected error occurred')
    }
  }
}

// Define the flavor features interface
interface FlavorFeatures {
  network_optimised: boolean
  no_hibernation: boolean
  no_snapshot: boolean
  local_storage_only: boolean
}

// First, let's define a proper interface for the deployVM parameters
interface DeployVMParams {
  name: string
  image_name: string
  create_bootable_volume?: boolean
  flavor_name: string
  key_name: string
  region: string
  assign_floating_ip: boolean
  enable_port_randomization: boolean
  count?: number
  flavor_features?: FlavorFeatures
}

// Define a proper interface for the response
interface DeployVMResponse {
  status: string
  rental: {
    id: number
    user_id: number
    flavor_name: string
    region: string
    instance_id: string
    status: string
    startedAt: string
    gpu_name: string
    hyperstack_gpu_name: string
  }
  hyperstackData: {
    instances: Array<{
      id: string
      [key: string]: unknown
    }>
  }
}

// Define proper interfaces for the data structures
interface ManageVMResponse {
  status: string
  message: string
  data?: unknown
}

// Define interface for VM management parameters
interface ManageVMParams {
  vmId: number | string
  // Add any additional parameters that might be needed for specific actions
  force?: boolean
}

// Define interface for VM delete parameters
interface DeleteVMParams {
  force?: boolean
}

// Define interface for VNC URL response
interface VncUrlResponse {
  status: string
  vnc_url?: string
  message?: string
}

// Update the interface based on the actual response structure
interface ActiveGpuResponse {
  status: string
  gpu:
    | Array<{
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
      }>
    | {
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
      }
}

// Update the deployVM function to better handle error messages from the backend
export const deployVM = async (params: DeployVMParams): Promise<DeployVMResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/deploy`
    const token = localStorage.getItem('authToken')

    const result = await axios.post(url, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as DeployVMResponse
  } catch (error: unknown) {
    console.error('Deploy GPU error:', error instanceof Error ? error.message : 'Unknown error')

    // Extract specific error message from the backend response if available
    if (axios.isAxiosError(error) && error.response?.data) {
      // Type assertion for the error response data
      const errorData = error.response.data as { message?: string }
      if (errorData.message) {
        throw new Error(errorData.message)
      }
    }

    throw new Error('Failed to deploy GPU')
  }
}

// Enhanced manageVM function with better error handling and more flexibility
export const manageVM = async (action: string, params: ManageVMParams): Promise<ManageVMResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/manageVM/${action}`
    const token = localStorage.getItem('authToken')

    const result = await axios.post(url, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as ManageVMResponse
  } catch (error: unknown) {
    console.error(`Manage VM (${action}) error:`, error instanceof Error ? error.message : 'Unknown error')

    // Enhanced error handling with more specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        const statusCode = error.response.status
        // Add type assertion for error response data
        const errorData = error.response.data as { message?: string }
        const errorMessage = errorData?.message || `Failed to ${action} instance`

        if (statusCode === 400) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else if (statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (statusCode === 403) {
          throw new Error("You don't have permission to perform this action.")
        } else if (statusCode === 404) {
          throw new Error('Instance not found or already deleted.')
        } else if (statusCode === 409) {
          throw new Error(`Operation conflict: ${errorMessage}`)
        } else if (statusCode >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.')
      } else {
        // Something happened in setting up the request
        throw new Error(`Request error: ${error.message}`)
      }
    } else if (error instanceof Error) {
      throw new Error(error.message || `Failed to ${action} instance`)
    } else {
      throw new Error(`Failed to ${action} instance`)
    }
  }
}

// Add a dedicated function for deleting VMs
export const deleteVM = async (rentalId: number | string, params: DeleteVMParams = {}): Promise<ManageVMResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/deleteVM/${rentalId}`
    const token = localStorage.getItem('authToken')

    const result = await axios.post(url, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as ManageVMResponse
  } catch (error: unknown) {
    console.error(`Delete VM error:`, error instanceof Error ? error.message : 'Unknown error')

    // Enhanced error handling with more specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        const statusCode = error.response.status
        // Add type assertion for error response data
        const errorData = error.response.data as { message?: string }
        const errorMessage = errorData?.message || `Failed to delete instance`

        if (statusCode === 400) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else if (statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (statusCode === 403) {
          throw new Error("You don't have permission to perform this action.")
        } else if (statusCode === 404) {
          throw new Error('Instance not found or already deleted.')
        } else if (statusCode === 409) {
          throw new Error(`Operation conflict: ${errorMessage}`)
        } else if (statusCode >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.')
      } else {
        // Something happened in setting up the request
        throw new Error(`Request error: ${error.message}`)
      }
    } else if (error instanceof Error) {
      throw new Error(error.message || `Failed to delete instance`)
    } else {
      throw new Error(`Failed to delete instance`)
    }
  }
}

// Update the function to match the actual response structure
export const getGpuAction = async (): Promise<ActiveGpuResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus`
    const token = localStorage.getItem('authToken')

    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as ActiveGpuResponse
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Handle the case where no GPU is found for the user
      throw new Error('No active GPU found for the user')
    } else if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch active GPU')
    } else {
      throw new Error('An unexpected error occurred while fetching active GPU')
    }
  }
}

// Update the getVncUrl function with proper type assertions

// Replace the existing getVncUrl function with a properly typed version
export const getVncUrl = async (vmId: number | string): Promise<VncUrlResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/${vmId}/vnc-url`
    const token = localStorage.getItem('authToken')

    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as VncUrlResponse
  } catch (error: unknown) {
    console.error(`Get VNC URL error:`, error instanceof Error ? error.message : 'Unknown error')

    // Enhanced error handling with more specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        const statusCode = error.response.status
        // Add type assertion for error response data
        const errorData = error.response.data as { message?: string }
        const errorMessage = errorData?.message || `Failed to get VNC URL`

        if (statusCode === 400) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else if (statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (statusCode === 403) {
          throw new Error("You don't have permission to access this console.")
        } else if (statusCode === 404) {
          throw new Error('VM not found or console not available.')
        } else if (statusCode >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.')
      } else {
        // Something happened in setting up the request
        throw new Error(`Request error: ${error.message}`)
      }
    } else if (error instanceof Error) {
      throw new Error(error.message || `Failed to get VNC URL`)
    } else {
      throw new Error(`Failed to get VNC URL`)
    }
  }
}

// Update the ReservationRequest interface
interface ReservationRequest {
  contact_email: string
  gpu_types: string[] // This will now contain the actual GPU names
  flavor_name: string[] // This will now contain the actual flavor names
  duration: string // Changed from string[] to string
  timing: string // Changed from string[] to string
  requirement?: string
  user?: User // Changed from any to User type
}

// Update the ReservationResponse interface
interface ReservationResponse {
  status: string
  reservation: {
    id: number
    user_id: number
    contact_email: string
    gpu_types: string[]
    flavor_name: string[]
    duration: string // Changed from string[] to string
    timing: string // Changed from string[] to string
    requirement?: string
    createdAt: string
    updatedAt: string
    user?: User // Changed from any to User type
  }
}

// Add this function to create a GPU reservation
export const createReservation = async (params: ReservationRequest): Promise<ReservationResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/reserve`
    const token = localStorage.getItem('authToken')

    // Get user data if not provided
    if (!params.user) {
      try {
        const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/user`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        // Add a more comprehensive type assertion for the entire response structure
        const userData = userResponse.data as { message: string; user: User }
        params.user = userData.user
      } catch (userError) {
        console.error('Failed to fetch user data:', userError)
        // Continue with the request even if user data fetch fails
      }
    }

    const result = await axios.post(url, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as ReservationResponse
  } catch (err) {
    console.error('Create reservation error:', err instanceof Error ? err.message : 'Unknown error')

    // Enhanced error handling with more specific error messages
    if (axios.isAxiosError(err)) {
      if (err.response) {
        // Server responded with an error status
        const statusCode = err.response.status
        // Add type assertion for error response data
        const errorData = err.response.data as { message?: string }
        const errorMessage = errorData?.message || 'Failed to create reservation'

        if (statusCode === 400) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else if (statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (statusCode === 403) {
          throw new Error("You don't have permission to perform this action.")
        } else if (statusCode === 404) {
          throw new Error('Resource not found.')
        } else if (statusCode >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      } else if (err.request) {
        // Request was made but no response received
        throw new Error('No response from server. Please check your connection.')
      } else {
        // Something happened in setting up the request
        throw new Error(`Request error: ${err.message}`)
      }
    } else if (err instanceof Error) {
      throw new Error(err.message || 'Failed to create reservation')
    } else {
      throw new Error('Failed to create reservation')
    }
  }
}

// Define the response interface for attach floating IP
interface AttachFloatingIPResponse {
  status: string
  message: string
  result?: {
    status: boolean
    message: string
  }
}

// Define the response interface for detach floating IP
interface DetachFloatingIPResponse {
  status: string
  message: string
  result?: {
    status: boolean
    message: string
  }
}

// Function to attach a floating IP to an instance
export const attachFloatingIP = async (vmId: string | number): Promise<AttachFloatingIPResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/attach-floating-ip`
    const token = localStorage.getItem('authToken')

    const response = await axios.post(
      url,
      { vmId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    return response.data as AttachFloatingIPResponse
  } catch (error) {
    console.error('Error attaching floating IP:', error)

    if (axios.isAxiosError(error) && error.response?.data) {
      // Return the error message from the API if available
      return error.response.data as AttachFloatingIPResponse
    }

    // Default error response
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to attach public IP'
    }
  }
}

// Function to detach a floating IP from an instance
export const detachFloatingIP = async (vmId: string | number): Promise<DetachFloatingIPResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/detach-floating-ip`
    const token = localStorage.getItem('authToken')

    const response = await axios.post(
      url,
      { vmId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    return response.data as DetachFloatingIPResponse
  } catch (error) {
    console.error('Error detaching floating IP:', error)

    if (axios.isAxiosError(error) && error.response?.data) {
      // Return the error message from the API if available
      return error.response.data as DetachFloatingIPResponse
    }

    // Default error response
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to detach public IP'
    }
  }
}
