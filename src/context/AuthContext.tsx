'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { tokenSignin } from '@/api/Auth'

// Define the User type to match the backend response
export interface User {
  id: number
  email: string
  balance: number
  role: string
  avatar: string | null
  status: string
  createdAt: string
  updatedAt: string
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode
}

// AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Function to handle token-based login
  const performTokenLogin = async () => {
    const token = localStorage.getItem('authToken')

    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Use the tokenSignin function from api/Auth.ts
      const response = await tokenSignin()

      // Update the token with the new one
      if (response.accessToken) {
        localStorage.setItem('authToken', response.accessToken)
      }

      // Set user data
      setUser(response.user)
    } catch (error) {
      console.error('Token login error:', error)
      // If token is invalid, clear it
      localStorage.removeItem('authToken')
      setError('Authentication failed. Please login again.')
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle email/password login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/signin`, { email, password })

      if (response.data.accessToken) {
        localStorage.setItem('authToken', response.data.accessToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`

        setUser(response.data.user)

        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Login failed. Please try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/auth/login')
  }

  // Check for token and authenticate on initial load and when token changes
  useEffect(() => {
    performTokenLogin()

    // Set up axios interceptor to handle 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      // Clean up interceptor on unmount
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
