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
        backgroundColor: '#1a1a1a',
        color: '#fff',
        textAlign: 'center'
      }}
    >
      <h1 style={{ fontSize: '48px' }}>AVAX GPU Marketplace</h1>
      <p style={{ fontSize: '18px', marginTop: '10px' }}>Comming Soon...</p>
    </div>
  )
}

export default Custom404
