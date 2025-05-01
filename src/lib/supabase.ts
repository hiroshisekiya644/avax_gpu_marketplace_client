import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Helper function to get the Supabase token
export const getSupabaseToken = async (): Promise<string | null> => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting Supabase token:', error)
    return null
  }
}

// Helper function to handle Supabase authentication with your backend
export const syncSupabaseAuth = async (): Promise<boolean> => {
  try {
    const token = await getSupabaseToken()

    if (!token) return false

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/supabaseSignIn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('authToken', data.accessToken)
      return true
    }

    return false
  } catch (error) {
    console.error('Error syncing Supabase auth:', error)
    return false
  }
}
