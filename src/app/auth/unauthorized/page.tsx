'use client'
import { useRouter } from 'next/navigation'

const UnAuthorized = () => {
  const router = useRouter()
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
      <div style={{ fontSize: '18px', marginTop: '10px' }}>You are not authorized. Please sign in first...</div>
      <div
        style={{ fontSize: '18px', marginTop: '10px', cursor: 'pointer' }}
        onClick={() => router.push('/auth/login')}
      >
        SIGN IN
      </div>
    </div>
  )
}

export default UnAuthorized
