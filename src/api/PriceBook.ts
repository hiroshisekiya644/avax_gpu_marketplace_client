import axios, { AxiosResponse } from 'axios'

export const getPriceBook = async (): Promise<any> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/getPriceBook`

    const result: AxiosResponse<any> = await axios.get(url, {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTc0MTAzODQ4OSwiZXhwIjoxNzQxMTI0ODg5fQ.0MfjQGNkPuC9BlK8DT0J8acadSU1s-hT5qlTaNGvQZQ'
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
