'use client'
import { useEffect } from 'react'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabaseSignIn } from '@/api/Auth'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function AuthCallback() {
  const router = useRouter()
  const { updateUser } = useUser()

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
            // Use the supabaseSignIn function from Auth.ts
            const authResponse = await supabaseSignIn(session.access_token)

            // Update the user context if user data is available
            if (authResponse && authResponse.user) {
              updateUser(authResponse.user)
            }

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
  }, [router, updateUser])

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
