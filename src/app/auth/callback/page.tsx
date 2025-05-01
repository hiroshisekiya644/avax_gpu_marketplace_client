'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import styles from './page.module.css'
import { Snackbar } from '@/components/snackbar/SnackBar'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error(sessionError.message)
        }

        if (session?.access_token) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/supabaseSignIn`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            })

            if (!response.ok) {
              throw new Error('Failed to authenticate with backend')
            }

            localStorage.setItem('authToken', session.access_token)
            Snackbar({ message: 'Authentication successful!' })
            router.push('/dashboard/create-cluster')
          } catch (error) {
            console.error('Backend authentication error:', error)
            Snackbar({ message: 'Failed to authenticate with backend', type: 'error' })
            router.push('/auth/login')
          }
        } else {
          Snackbar({ message: 'No valid session found', type: 'error' })
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        Snackbar({ message: 'Authentication failed', type: 'error' })
        router.push('/auth/login')
      }
    }

    syncAuth()
  }, [router])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <Image src="/logo/logo.jpg" alt="Logo" width={56} height={56} className={styles.imageButton} priority />
          <Flex className={styles.title}>rLoop GPU Marketplace</Flex>
        </div>

        <div className={styles.spinner}></div>

        <h2 className={styles.text}>Authenticating</h2>
        <p className={styles.subText}>Please wait while we securely log you in to your account...</p>

        <div className={styles.progressBar}>
          <div className={styles.progressBarFill}></div>
        </div>
      </div>
    </div>
  )
}
