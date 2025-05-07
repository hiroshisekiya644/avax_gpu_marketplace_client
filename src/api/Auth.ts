import axios, { type AxiosResponse } from 'axios'

export type AuthData = {
  email: string
  password: string
}

// Update the AuthResponse type to include the user.id field
export type AuthResponse = {
  user: {
    id: number
    email: string
    balance: number
    role: string
    avatar: string | null
    createdAt: string
    status: string
  }
  accessToken?: string
  message: string
  status: string
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

// Update tokenSignin to match the actual response format
export const tokenSignin = async (): Promise<AuthResponse> => {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('authToken')

    if (!token) {
      throw new Error('No authentication token found')
    }

    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/tokensignin`

    // Send the request with the token in the Authorization header
    const result: AxiosResponse<AuthResponse> = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // If successful, update the token in localStorage with the new one
    if (result.data.accessToken) {
      localStorage.setItem('authToken', result.data.accessToken)
    }

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

// Update supabaseSignIn to match the actual response format
export const supabaseSignIn = async (accessToken: string): Promise<AuthResponse> => {
  try {
    if (!accessToken) {
      throw new Error('No Supabase access token provided')
    }

    const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/supabaseSignIn`

    // Send the request with the Supabase token in the Authorization header
    const result: AxiosResponse<AuthResponse> = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // If successful, store the token in localStorage
    if (result.data.accessToken) {
      localStorage.setItem('authToken', result.data.accessToken)
    }

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

// Update the signout function to use the UserContext's logout function
export const signout = () => {
  localStorage.removeItem('authToken')
  // Use window.location for a full page refresh and navigation to login
  window.location.href = '/auth/login'
}
