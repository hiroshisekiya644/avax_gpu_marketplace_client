import axios, { type AxiosResponse } from 'axios'
import { redirect } from 'next/navigation'

export type AuthData = {
  email: string
  password: string
}

export type AuthResponse = {
  message: string
  userId: number
  accessToken: string
}

type AuthAction = 'signup' | 'signin'

export const authenticateAction = async (action: AuthAction, data: AuthData): Promise<AuthResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/${action}`

    const result: AxiosResponse<AuthResponse> = await axios.post(url, data)
    return result.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Type assertion for the error response data
      const errorData = error.response?.data as { message?: string } | undefined
      // Extract the error message from the response if available
      const errorMessage = errorData?.message || 'An Axios error occurred'
      throw new Error(errorMessage)
    } else if (error instanceof Error) {
      throw new Error(error.message || 'An unknown error occurred')
    } else {
      throw new Error('An unexpected error occurred')
    }
  }
}

export const signout = async () => {
  sessionStorage.clear()
  await redirect('/auth/login')
}
