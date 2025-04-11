'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Custom404 = () => {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        textAlign: 'center',
        padding: '0 20px'
      }}
    >
      <h1
        style={{
          fontSize: '48px',
          fontWeight: '700',
          color: '#1fefee'
        }}
      >
        rLoop GPU Marketplace
      </h1>
      <p
        style={{
          fontSize: '18px',
          marginTop: '16px',
          color: '#d9d9d9'
        }}
      >
        Coming Soon...
      </p>
      <p
        style={{
          fontSize: '14px',
          marginTop: '24px',
          color: '#999'
        }}
      >
        Redirecting to login page...
      </p>
    </div>
  )
}

export default Custom404
