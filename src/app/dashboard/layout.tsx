'use client'
import type React from 'react'
import { useEffect, useState } from 'react'
import { usePathname, redirect } from 'next/navigation'
import ClientWrapper from '@/components/section/ClientWrapper'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const [authToken, setAuthToken] = useState<string | null | undefined>(undefined) // `undefined` indicates loading state

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('authToken')
      setAuthToken(token)
    }
  }, [])

  useEffect(() => {
    if (authToken !== undefined) {
      if (authToken == null && pathname !== '/auth/login' && pathname !== '/auth/signup') {
        redirect('/auth/unauthorized')
      }
    }
  }, [authToken, pathname])

  if (pathname === '/auth/login' || pathname === '/auth/signup') {
    return <ClientWrapper>{children}</ClientWrapper>
  }

  return <ClientWrapper>{children}</ClientWrapper>
}

export default Layout
