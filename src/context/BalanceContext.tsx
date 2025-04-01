'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getBalance } from '@/api/Payment'
import { getUserData } from '@/api/User'
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

  // Fetch user data to get the user ID
  const fetchUserData = useCallback(async () => {
    try {
      const response = await getUserData()
      if (response && response.user) {
        setUserId(response.user.id)
        return response.user.id
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
    return null
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

  // Setup socket connection for real-time balance updates
  useEffect(() => {
    const setupSocket = async () => {
      try {
        // Get user ID if not already set
        const currentUserId = userId || (await fetchUserData())
        if (!currentUserId) return

        // Initialize socket and join user room
        const socket = initializeSocket()
        joinUserRoom(currentUserId)

        // Listen for balance updates
        socket.on('balance:update', (data: { balance: number }) => {
          console.log('Received balance update:', data)
          if (data && typeof data.balance === 'number') {
            setBalance(data.balance)
            setIsLoading(false)
          }
        })

        // Return a cleanup function
        return () => {
          socket.off('balance:update')
        }
      } catch (error) {
        console.error('Error setting up socket:', error)
      }
    }

    setupSocket()
  }, [userId, fetchUserData])

  // Initial balance fetch
  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  const value = {
    balance,
    isLoading,
    error,
    refreshBalance
  }

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>
}
