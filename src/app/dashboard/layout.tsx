'use client'
import React, { useEffect, useState } from 'react'
import { Theme } from '@radix-ui/themes'
import { usePathname, redirect } from 'next/navigation'
import '@radix-ui/themes/styles.css'
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
    return (
      <Theme>
        <ClientWrapper>{children}</ClientWrapper>
      </Theme>
    )
  }

  return (
    <Theme>
      <ClientWrapper>{children}</ClientWrapper>
    </Theme>
  )
}

export default Layout
