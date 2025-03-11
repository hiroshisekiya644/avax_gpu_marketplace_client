import axios, { AxiosResponse } from 'axios'

interface ImageResponse {
  data: {
    images: Array<{
      id: number
      name: string
      description: string | null
      path?: string
      region_name: string
      type: string
      version: string
      size: number
      display_size: string
      green_status?: string
      logo?: string
    }>
  }
}

export const getImageAction = async (): Promise<ImageResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getImage`

    const token = sessionStorage.getItem('authToken')

    const result: AxiosResponse<ImageResponse> = await axios.get(url, {
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
