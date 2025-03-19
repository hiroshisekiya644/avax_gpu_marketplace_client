import axios, { AxiosResponse } from 'axios'

interface PaymentResponse {
  data: {
    balance: number,
  }
}

export const getBalance = async (): Promise<PaymentResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/payment/getBalance`

    const token = sessionStorage.getItem('authToken')

    const result: AxiosResponse<PaymentResponse> = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    console.log(result);
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
