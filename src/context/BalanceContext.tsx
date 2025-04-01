'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getBalance } from '@/api/Payment'

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

  // Refresh balance when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBalance()
      }
    }

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Initial balance fetch
    fetchBalance()

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
