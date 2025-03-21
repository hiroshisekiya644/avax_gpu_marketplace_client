import axios, { AxiosResponse } from 'axios'

// Define interfaces based on the actual API response structure
interface ImageLabel {
  key: string
  value: string
}

interface ImageDetails {
  id: number
  name: string
  region_name: string
  type: string
  version: string
  size: number
  display_size: string
  description: string | null
  snapshot: null
  is_public: boolean
  created_at: string
  labels: ImageLabel[] // Replace any[] with a specific type
}

interface RegionImageGroup {
  region_name: string
  green_status: 'GREEN' | 'NOT_GREEN'
  type: string
  logo: string | null
  images: ImageDetails[]
}

// Updated to match the actual API response structure
interface ImageResponse {
  data: {
    status: boolean | string
    message: string
    images: RegionImageGroup[]
  }
  status: string
}

/**
 * Fetches image data from the backend API
 * 
 * @returns Promise containing image data organized by regions
 */
export const getImageAction = async (): Promise<ImageResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getImage`
    
    // Use a safer approach to get token from sessionStorage
    let token: string | null = null
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('authToken')
    }

    const result: AxiosResponse<ImageResponse> = await axios.get(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
    
    return result.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data || error.message)
      throw new Error(`API Error: ${error.response?.status || ''} ${error.message}`)
    } else if (error instanceof Error) {
      console.error('Error:', error.message)
      throw new Error(error.message || 'An unknown error occurred')
    } else {
      console.error('Unexpected error:', error)
      throw new Error('An unexpected error occurred')
    }
  }
}