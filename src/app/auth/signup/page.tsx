'use client'
import type React from 'react'
import { useState, useEffect } from 'react'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { Flex, Button, Separator } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authenticateAction, type AuthData, type AuthResponse } from '@/api/Auth'
import { AuthInput } from '@/components/input/AuthInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { EMAIL_REGEX, PASSWORD_REGEX } from '@/utils/Regex'
import styles from '../login/page.module.css'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { supabase } from '@/lib/supabase'

const SignUp = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      router.push('/dashboard/create-cluster')
    }
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setPasswordError('')
    setEmailError('')

    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please provide a valid email address')
      Snackbar({ message: 'Please provide valid email address.', type: 'error' })
      setIsLoading(false)
      return
    }

    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError(
        'Password must be at least 8 characters, contain uppercase, lowercase, number, and special character'
      )
      Snackbar({
        message: 'Password must be at least 8 characters, contain uppercase, lowercase, number, and special character',
        type: 'error'
      })
      setIsLoading(false)
      return
    }

    const userData: AuthData = { email, password }

    try {
      const response: AuthResponse = await authenticateAction('signup', userData)
      Snackbar({ message: 'You have successfully signed up!' })
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

  const GoogleIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="google" />

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

  const validatePassword = (value: string) => {
    setPassword(value)
    if (value && !PASSWORD_REGEX.test(value)) {
      setPasswordError(
        'Password must be at least 8 characters, contain uppercase, lowercase, number, and special character'
      )
    } else {
      setPasswordError('')
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
          <Flex className={styles.text}>Create Account</Flex>
          <Flex className={styles.subText}>
            Sign up to rLoop GPU marketplace to access high-performance computing resources.
          </Flex>

          <form onSubmit={handleSignUp} style={{ width: '100%' }} className={styles.formContainer}>
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
                onChange={(e) => validatePassword(e.target.value)}
                error={passwordError}
              />

              {password && (
                <Flex direction="column" gap="1" style={{ fontSize: '12px', marginTop: '-8px' }}>
                  <Flex align="center" gap="2" className={styles.passwordStrengthIndicator}>
                    <div
                      className={styles.passwordStrengthDot}
                      style={{
                        backgroundColor: password.length >= 8 ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span className={styles.passwordStrengthText}>At least 8 characters</span>
                  </Flex>
                  <Flex align="center" gap="2" className={styles.passwordStrengthIndicator}>
                    <div
                      className={styles.passwordStrengthDot}
                      style={{
                        backgroundColor: /[A-Z]/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span className={styles.passwordStrengthText}>One uppercase letter</span>
                  </Flex>
                  <Flex align="center" gap="2" className={styles.passwordStrengthIndicator}>
                    <div
                      className={styles.passwordStrengthDot}
                      style={{
                        backgroundColor: /[a-z]/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span className={styles.passwordStrengthText}>One lowercase letter</span>
                  </Flex>
                  <Flex align="center" gap="2" className={styles.passwordStrengthIndicator}>
                    <div
                      className={styles.passwordStrengthDot}
                      style={{
                        backgroundColor: /\d/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span className={styles.passwordStrengthText}>One number</span>
                  </Flex>
                  <Flex align="center" gap="2" className={styles.passwordStrengthIndicator}>
                    <div
                      className={styles.passwordStrengthDot}
                      style={{
                        backgroundColor: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span className={styles.passwordStrengthText}>One special character</span>
                  </Flex>
                </Flex>
              )}
            </Flex>

            <Flex width="100%" mt="4">
              <Button className={styles.submitButton} type="submit" disabled={isLoading || !email || !password}>
                {isLoading ? 'Signing up...' : 'Create Account'}
              </Button>
            </Flex>

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
                  <span>Continue with Google</span>
                </Flex>
              )}
            </Button>
          </form>

          <Flex gap="4" align="center" justify="center" width="100%" className={styles.footerLinks}>
            <Flex className={styles.subText}>Already have an account?</Flex>
            <Link href="/auth/login">
              <Flex className={styles.subTextButton}>Sign In</Flex>
            </Link>
          </Flex>
        </Flex>
      </div>
    </Flex>
  )
}

export default SignUp
