import axios, { type AxiosResponse } from 'axios'

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
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/availability`

    const token = sessionStorage.getItem('authToken')

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

// Define interface for VM management response
interface ManageVMResponse {
  status: string
  message: string
  data?: any
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

// Update the deployVM function with proper types
export const deployVM = async (params: DeployVMParams): Promise<DeployVMResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/deploy`
    const token = sessionStorage.getItem('authToken')

    const result = await axios.post(url, params, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data as DeployVMResponse
  } catch (error: unknown) {
    console.error('Deploy GPU error:', error instanceof Error ? error.message : 'Unknown error')
    throw new Error('Failed to deploy gpu')
  }
}

// Enhanced manageVM function with better error handling and more flexibility
export const manageVM = async (action: string, params: ManageVMParams): Promise<ManageVMResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/manageVM/${action}`
    const token = sessionStorage.getItem('authToken')

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
        const errorMessage = error.response.data?.message || `Failed to ${action} instance`

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
    const token = sessionStorage.getItem('authToken')

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
        const errorMessage = error.response.data?.message || `Failed to delete instance`

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
    const token = sessionStorage.getItem('authToken')

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

// Add this function to get the VNC URL for a VM
export const getVncUrl = async (vmId: number | string): Promise<{ url: string }> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/${vmId}/vnc-url`
    const token = sessionStorage.getItem('authToken')

    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return result.data
  } catch (error: unknown) {
    console.error(`Get VNC URL error:`, error instanceof Error ? error.message : 'Unknown error')

    // Enhanced error handling with more specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        const statusCode = error.response.status
        const errorMessage = error.response.data?.message || `Failed to get VNC URL`

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
