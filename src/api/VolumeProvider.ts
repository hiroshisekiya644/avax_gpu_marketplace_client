import axios, { type AxiosResponse } from 'axios'

// Define the volume interface based on your backend response
interface Volume {
  id: number
  user_id: number
  hyperstack_volume_id: number
  name: string
  size: number
  type: string // "Cloud-SSD", "Cloud-HDD", etc.
  region: string
  bootable: boolean
  image_id: number | null
  status: 'creating' | 'available' | 'attached' | 'in-use' | 'deleting' | 'error'
  deleted_at: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// Define the response interface for get volumes
interface GetVolumesResponse {
  status: string
  volumes: Volume[]
  message?: string
}

// Function to get all volumes for the authenticated user
export const getVolumes = async (): Promise<GetVolumesResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/volume/get-volume`
    const token = localStorage.getItem('authToken')

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.')
    }

    const result: AxiosResponse<GetVolumesResponse> = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    return result.data
  } catch (error: unknown) {
    console.error('Get volumes error:', error instanceof Error ? error.message : 'Unknown error')

    // Enhanced error handling with more specific error messages
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        const statusCode = error.response.status
        const errorData = error.response.data as { message?: string }
        const errorMessage = errorData?.message || 'Failed to fetch volumes'

        if (statusCode === 400) {
          throw new Error(`Invalid request: ${errorMessage}`)
        } else if (statusCode === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (statusCode === 403) {
          throw new Error("You don't have permission to access volumes.")
        } else if (statusCode === 404) {
          throw new Error('No volumes found.')
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
      throw new Error(error.message || 'Failed to fetch volumes')
    } else {
      throw new Error('Failed to fetch volumes')
    }
  }
}

// Export the Volume interface for use in other components
export type { Volume, GetVolumesResponse }
