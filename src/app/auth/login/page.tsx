'use client'
import type React from 'react'
import { useState, useEffect } from 'react'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { Flex, Button, Separator, Text } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authenticateAction, type AuthData, type AuthResponse } from '@/api/Auth'
import { AuthInput } from '@/components/input/AuthInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { EMAIL_REGEX } from '@/utils/Regex'
import { supabase, syncSupabaseAuth } from '@/lib/supabase'
import { useUser } from '@/context/UserContext'
import styles from './page.module.css'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'

const GoogleIcon = () => <DynamicSvgIcon width={20} height={20} alt="Google" iconName="google" />

const Login = () => {
  const router = useRouter()
  const { updateUser } = useUser()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<string>('')

  // Check if we have a session from Supabase auth
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session) {
        try {
          // Sync the Supabase session with our backend
          const success = await syncSupabaseAuth()

          if (success) {
            Snackbar({ message: 'You have successfully logged in with Google!' })
            router.push('/dashboard/create-cluster')
          }
        } catch (error) {
          console.error('Error syncing user data:', error)
        }
      }
    }

    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setEmailError('')

    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please provide a valid email address')
      Snackbar({ message: 'Please provide valid email address.', type: 'error' })
      setIsLoading(false)
      return
    }

    const userData: AuthData = { email, password }

    try {
      const response: AuthResponse = await authenticateAction('signin', userData)
      Snackbar({ message: 'You have successfully logged in!' })

      localStorage.setItem('authToken', response.accessToken)
      router.push('/dashboard/create-cluster')
    } catch (error: unknown) {
      if (error instanceof Error) {
        Snackbar({ message: error.message, type: 'error' })
      } else {
        Snackbar({ message: 'An unknown error occurred', type: 'error' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        throw error
      }
      // The redirect happens automatically, so we don't need to do anything else here
    } catch (error: unknown) {
      if (error instanceof Error) {
        Snackbar({ message: error.message, type: 'error' })
      } else {
        Snackbar({ message: 'An error occurred during Google sign in', type: 'error' })
      }
      setIsGoogleLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const validateEmail = (value: string) => {
    setEmail(value)
    if (value && !EMAIL_REGEX.test(value)) {
      setEmailError('Please provide a valid email address')
    } else {
      setEmailError('')
    }
  }

  return (
    <Flex className={styles.bg}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <Image src="/logo/logo.jpg" alt="Logo" width={48} height={48} className={styles.imageButton} priority />
          <Flex className={styles.title}>rLoop GPU Marketplace</Flex>
        </div>

        <Flex direction="column" gap="4" justify="center" align="center">
          <Flex className={styles.text}>Welcome Back</Flex>
          <Flex className={styles.subText}>Log in to rLoop GPU marketplace to continue to Compute Platform.</Flex>

          <form onSubmit={handleLogin} style={{ width: '100%' }} className={styles.formContainer}>
            <Flex direction="column" gap="4">
              <AuthInput
                id="email"
                label="Email Address"
                placeholder="Enter your email address"
                type="text"
                value={email}
                onChange={(e) => validateEmail(e.target.value)}
                error={emailError}
              />
              <AuthInput
                id="password"
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                icon={
                  showPassword ? (
                    <EyeClosedIcon onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }} />
                  ) : (
                    <EyeOpenIcon onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }} />
                  )
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Flex>

            <Flex width="100%" mt="4">
              <Button className={styles.submitButton} type="submit" disabled={isLoading || !email || !password}>
                {isLoading ? 'Logging in...' : 'Sign In'}
              </Button>
            </Flex>
          </form>

          <Flex direction="column" width="100%" align="center" gap="3" mt="4">
            <Flex align="center" width="100%" gap="2">
              <Separator size="4" />
              <Text size="2" color="gray">
                OR
              </Text>
              <Separator size="4" />
            </Flex>

            <Button className={styles.googleButton} onClick={handleGoogleLogin} disabled={isGoogleLoading}>
              <GoogleIcon />
              <span>{isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </Button>
          </Flex>

          <Flex gap="4" align="center" justify="center" width="100%" className={styles.footerLinks}>
            <Flex className={styles.subText}>Don&apos;t have an account?</Flex>
            <Link href="/auth/signup">
              <Flex className={styles.subTextButton}>Sign Up</Flex>
            </Link>
          </Flex>
        </Flex>
      </div>
    </Flex>
  )
}

export default Login
