import axios, { AxiosResponse } from 'axios'

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
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getGPUAvailability`

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
