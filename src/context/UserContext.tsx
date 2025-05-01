'use client'

import type React from 'react'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { tokenSignin } from '@/api/Auth'

// Define the User type based on the API response
type User = {
  email: string
  balance: number
  role: string
  avatar: string | null
  createdAt: string
  status: string
}

// Define the context state type
type UserContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  updateUser: (user: User) => void
  refreshUserData: () => Promise<void>
  logout: () => void
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  updateUser: () => {},
  refreshUserData: async () => {},
  logout: () => {}
})

// Custom hook to use the user context
export const useUser = () => useContext(UserContext)

type UserProviderProps = {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Function to update user data
  const updateUser = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    setError(null)
  }

  // Function to refresh user data from the token
  const refreshUserData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await tokenSignin()

      if (response.user && response.status === 'success') {
        setUser(response.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setError('Failed to authenticate user')
      }
    } catch (err) {
      setUser(null)
      setIsAuthenticated(false)
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
    // Use window.location for a full page refresh and navigation to login
    window.location.href = '/auth/login'
  }

  // Check for token and authenticate on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (token) {
      refreshUserData()
    } else {
      setIsLoading(false)
      setIsAuthenticated(false)
    }
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    updateUser,
    refreshUserData,
    logout
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
