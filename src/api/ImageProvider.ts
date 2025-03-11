import axios, { AxiosResponse } from 'axios'

export const getImageAction = async (): Promise<any> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getImage`

    const token = sessionStorage.getItem('authToken')

    const result: AxiosResponse<any> = await axios.get(url, {
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
