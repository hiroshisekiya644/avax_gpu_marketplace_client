'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getBalance } from '@/api/Payment'
import { getUserData } from '@/api/User'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { initializeSocket, joinUserRoom } from '@/utils/socket'

interface BalanceContextType {
  balance: number
  isLoading: boolean
  error: string | null
  refreshBalance: () => Promise<void>
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export function useBalance() {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}

interface BalanceProviderProps {
  children: ReactNode
}

export function BalanceProvider({ children }: BalanceProviderProps) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false)

  // Function to fetch user data and get the user ID
  const fetchUserData = useCallback(async () => {
    try {
      const response = await getUserData()
      if (response && response.user && response.user.id) {
        setUserId(response.user.id)
        return response.user.id
      }
      return null
    } catch (err) {
      console.error('Failed to fetch user data:', err)
      return null
    }
  }, [])

  // Function to fetch balance
  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedBalance = await getBalance()
      setBalance(fetchedBalance)
    } catch (err) {
      console.error('Balance fetch error:', err)
      setError('Failed to fetch balance')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Public method to refresh balance
  const refreshBalance = useCallback(async () => {
    await fetchBalance()
  }, [fetchBalance])

  // Initialize socket connection and fetch user ID
  useEffect(() => {
    const initializeData = async () => {
      // Only try to fetch user data if we have an auth token
      const authToken = sessionStorage.getItem('authToken')
      if (!authToken) return

      try {
        const id = await fetchUserData()
        if (id) {
          // Initialize socket with user ID
          initializeSocket() // Just initialize without storing the reference
          joinUserRoom(id)
          setSocketInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing data:', error)
      }
    }

    if (!socketInitialized) {
      initializeData()
    }
  }, [fetchUserData, socketInitialized])

  // Set up socket listeners
  useEffect(() => {
    if (!socketInitialized || !userId) return

    const socket = initializeSocket()

    // Listen for balance updates
    socket.on('balance-update', (data: { newBalance: number }) => {
      setBalance(data.newBalance)
      setIsLoading(false)
    })

    // Listen for low balance warnings
    socket.on('low-balance-warning', (data: { warning: string; currentBalance: number }) => {
      setBalance(data.currentBalance)
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

    // Initial balance fetch
    fetchBalance()

    // Cleanup
    return () => {
      socket.off('balance-update')
      socket.off('low-balance-warning')
      socket.off('gpu-low-balance')
    }
  }, [userId, fetchBalance, socketInitialized])

  // Refresh balance when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBalance()
      }
    }

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchBalance])

  const value = {
    balance,
    isLoading,
    error,
    refreshBalance
  }

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>
}
