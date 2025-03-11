import axios, { AxiosResponse } from 'axios'

interface RegionResponse {
  data: {
    regions: Array<{
      name: string
      id: string
    }>
  }
}

export const getRegionAction = async (): Promise<RegionResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getRegion`

    const token = sessionStorage.getItem('authToken')

    const result: AxiosResponse<RegionResponse> = await axios.get(url, {
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
