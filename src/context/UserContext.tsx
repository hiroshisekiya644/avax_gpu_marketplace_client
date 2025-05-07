'use client'

import type React from 'react'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { tokenSignin } from '@/api/Auth'
import { getUserData } from '@/api/User'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { initializeSocket, joinUserRoom } from '@/utils/socket'

// Define the User type based on the API response
type User = {
  id?: number
  email: string
  balance: number
  role: string
  avatar: string | null
  createdAt: string
  status: string
  is_deleted?: boolean
  deleted_at?: string | null
  updatedAt?: string
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
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false)

  // Function to handle logout
  const logout = useCallback(() => {
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
    // Use window.location for a full page refresh and navigation to login
    window.location.href = '/auth/login'
  }, [])

  // Function to update user data
  const updateUser = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    setError(null)
  }

  // Function to refresh user data from the token
  const refreshUserData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First try to get user data from token signin
      const response = await tokenSignin()

      if (response.user && response.status === 'success') {
        // Store the access token if it's provided
        if (response.accessToken) {
          localStorage.setItem('authToken', response.accessToken)
        }

        setUser(response.user)
        setIsAuthenticated(true)
      } else {
        // If token signin fails, try to get user data directly
        try {
          const userData = await getUserData()
          if (userData && userData.user) {
            setUser(userData.user)
            setIsAuthenticated(true)
          } else {
            throw new Error('Failed to get user data')
          }
        } catch (error) {
          // Using error variable to avoid unused variable warning
          console.error('Failed to fetch user data:', error)
          setUser(null)
          setIsAuthenticated(false)
          setError('Failed to authenticate user')
        }
      }
    } catch (err) {
      setUser(null)
      setIsAuthenticated(false)
      setError(err instanceof Error ? err.message : 'Authentication failed')
      logout() // Call logout on error
    } finally {
      setIsLoading(false)
    }
  }, [logout]) // Added logout as a dependency

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id || socketInitialized) return

    try {
      // Initialize socket with user ID
      initializeSocket()
      joinUserRoom(user.id)
      setSocketInitialized(true)
    } catch (error) {
      console.error('Error initializing socket connection:', error)
    }
  }, [isAuthenticated, user?.id, socketInitialized])

  // Set up socket listeners for balance updates
  useEffect(() => {
    if (!socketInitialized || !user?.id) return

    const socket = initializeSocket()

    // Listen for balance updates
    socket.on('balance-update', (data: { newBalance: number }) => {
      setUser((prevUser) => (prevUser ? { ...prevUser, balance: data.newBalance } : null))
    })

    // Listen for low balance warnings
    socket.on('low-balance-warning', (data: { warning: string; currentBalance: number }) => {
      setUser((prevUser) => (prevUser ? { ...prevUser, balance: data.currentBalance } : null))
      Snackbar({
        message: data.warning,
        type: 'error',
        linkText: 'Add funds',
        linkHref: '/dashboard/billing'
      })
    })

    // Listen for critical low balance warnings
    socket.on(
      'gpu-low-balance',
      (data: { instance_id: string | number; time_remaining_seconds: number; warning: string }) => {
        // Format the remaining time in a human-readable format
        const minutes = Math.floor(data.time_remaining_seconds / 60)
        const seconds = Math.floor(data.time_remaining_seconds % 60)
        const timeDisplay =
          minutes > 0
            ? `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
            : `${seconds} second${seconds !== 1 ? 's' : ''}`

        Snackbar({
          message: `${data.warning} Time remaining: ${timeDisplay}`,
          type: 'error',
          linkText: 'Add funds now',
          linkHref: '/dashboard/billing'
        })
      }
    )

    // Cleanup
    return () => {
      socket.off('balance-update')
      socket.off('low-balance-warning')
      socket.off('gpu-low-balance')
    }
  }, [user?.id, socketInitialized])

  // Refresh user data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        refreshUserData()
      }
    }

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshUserData, isAuthenticated])

  // Check for token and authenticate on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (token) {
      refreshUserData()
    } else {
      setIsLoading(false)
      setIsAuthenticated(false)
    }
  }, [refreshUserData])

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
