import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Get the session
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (session) {
      // Call your backend API to handle Supabase sign-in
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/supabaseSignIn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            provider: 'google',
            email: session.user.email
          })
        })

        if (response.ok) {
          const data = await response.json()
          // Store the token from your backend
          if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', data.accessToken)
          }
        }
      } catch (error) {
        console.error('Error calling backend API:', error)
      }
    }
  }

  // URL to redirect to after sign in
  return NextResponse.redirect(`${requestUrl.origin}/dashboard/create-cluster`)
}
