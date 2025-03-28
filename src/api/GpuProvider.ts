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

export const getGPUAction = async (): Promise<GpuResponse> => {
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

// Update the interface based on the actual response structure
interface ActiveGpuResponse {
  status: string
  gpu: {
    id: number
    user_id: number
    flavor_name: string
    region: string
    instance_id: number
    gpu_name: string
    hyperstack_gpu_name: string
    status: string
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

// Update the function to match the actual response structure
export const getActiveGpuAction = async (): Promise<ActiveGpuResponse> => {
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
