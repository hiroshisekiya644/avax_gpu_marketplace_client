'use client'
import type React from 'react'
import { useState, useEffect } from 'react'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { Flex, Button, Separator } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authenticateAction, type AuthData, type AuthResponse } from '@/api/Auth'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { AuthInput } from '@/components/input/AuthInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/supabase'
import { EMAIL_REGEX } from '@/utils/Regex'
import styles from './page.module.css'

const GoogleIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="google" />

const Login = () => {
  const router = useRouter()
  const { updateUser } = useUser()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<string>('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      router.push('/dashboard/create-cluster')
    }
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

      if (response.accessToken) {
        localStorage.setItem('authToken', response.accessToken)
      } else {
        console.error('No access token received from the server')
        Snackbar({ message: 'Authentication successful but no token received', type: 'info' })
      }

      // Update the user context with the user data from the response
      if (response.user) {
        updateUser(response.user)
      }

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
    setIsGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      Snackbar({ message: error.message, type: 'error' })
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
          <Image src="/logo/logo.jpg" alt="Logo" width={56} height={56} className={styles.imageButton} priority />
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

              <Flex justify="end" width="100%">
                <Link href="/auth/forgot-password">
                  <span className={styles.forgotPassword}>Forgot password?</span>
                </Link>
              </Flex>
            </Flex>

            <Flex width="100%" mt="4">
              <Button className={styles.submitButton} type="submit" disabled={isLoading || !email || !password}>
                {isLoading ? (
                  <Flex align="center" gap="2">
                    <div className={styles.spinner}></div>
                    <span>Logging in...</span>
                  </Flex>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Flex>
          </form>

          <Flex align="center" gap="2" width="100%" my="3">
            <Separator size="4" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className={styles.orText}>OR</span>
            <Separator size="4" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </Flex>

          <Button onClick={handleGoogleLogin} disabled={isGoogleLoading} className={styles.googleButton}>
            {isGoogleLoading ? (
              <Flex align="center" gap="2">
                <div className={styles.spinner}></div>
                <span>Connecting...</span>
              </Flex>
            ) : (
              <Flex align="center" gap="2">
                <GoogleIcon />
                <span>Sign in with Google</span>
              </Flex>
            )}
          </Button>

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
