import axios, { AxiosResponse } from 'axios'

interface PriceBookResponse {
  data: Array<{
    id: number
    name: string
    value: string
    original_value: string
    discount_applied: boolean
    start_time: string | null
    end_time: string | null
  }>
}

export const getPriceBook = async (): Promise<PriceBookResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getpricebook`

    const token = localStorage.getItem('authToken')

    const result: AxiosResponse<PriceBookResponse> = await axios.get(url, {
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
