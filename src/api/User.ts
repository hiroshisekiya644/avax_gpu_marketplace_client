import axios, { type AxiosResponse } from 'axios'

// Update User interface to match the actual user object from the backend
export interface User {
  email: string
  balance: number
  role: string
  avatar: string | null
  createdAt: string
  status: string
}

// Update UserResponse to match the actual response format
export interface UserResponse {
  user: User
  message: string
  status: string
}

export interface UpdateUserData {
  currentPassword: string
  newPassword: string
}

export interface DeleteUserResponse {
  message: string
  status: string
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
const getAuthToken = () => localStorage.getItem('authToken')

export const getUserData = async (): Promise<UserResponse> => {
  try {
    const url = `${API_URL}/user`
    const token = getAuthToken()

    const result: AxiosResponse<UserResponse> = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { message?: string } | undefined
      const errorMessage = errorData?.message || 'An Axios error occurred'
      throw new Error(errorMessage)
    } else if (error instanceof Error) {
      throw new Error(error.message || 'An unknown error occurred')
    } else {
      throw new Error('An unexpected error occurred')
    }
  }
}

export const updateUser = async (data: UpdateUserData): Promise<UserResponse> => {
  try {
    const url = `${API_URL}/user`
    const token = getAuthToken()

    const result: AxiosResponse<UserResponse> = await axios.put(url, data, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { message?: string } | undefined
      const errorMessage = errorData?.message || 'An Axios error occurred'
      throw new Error(errorMessage)
    } else if (error instanceof Error) {
      throw new Error(error.message || 'An unknown error occurred')
    } else {
      throw new Error('An unexpected error occurred')
    }
  }
}

export const deleteUserAccount = async (): Promise<DeleteUserResponse> => {
  try {
    const url = `${API_URL}/user`
    const token = getAuthToken()

    const result: AxiosResponse<DeleteUserResponse> = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return result.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { message?: string } | undefined
      const errorMessage = errorData?.message || 'An Axios error occurred'
      throw new Error(errorMessage)
    } else if (error instanceof Error) {
      throw new Error(error.message || 'An unknown error occurred')
    } else {
      throw new Error('An unexpected error occurred')
    }
  }
}
