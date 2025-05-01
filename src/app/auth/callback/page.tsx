'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const syncAuth = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/supabaseSignIn`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        localStorage.setItem('authToken', session.access_token)
        router.push('/dashboard/create-cluster')
      }
    }

    syncAuth()
  }, [router])

  return <p>Redirecting...</p>
}
