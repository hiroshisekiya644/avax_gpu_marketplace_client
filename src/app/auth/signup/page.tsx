'use client'
import type React from 'react'
import { useState } from 'react'
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { Flex, Button } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authenticateAction, type AuthData, type AuthResponse } from '@/api/Auth'
import { AuthInput } from '@/components/input/AuthInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { EMAIL_REGEX, PASSWORD_REGEX } from '@/utils/Regex'
import styles from './../login/page.module.css'

const SignUp = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [passwordError, setPasswordError] = useState<string>('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setPasswordError('')

    if (!EMAIL_REGEX.test(email)) {
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
      sessionStorage.setItem('authToken', response.accessToken)
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
          <Flex className={styles.title}>rLoop GPU MARKETPLACE</Flex>
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
                onChange={(e) => setEmail(e.target.value)}
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
                <Flex
                  direction="column"
                  gap="1"
                  style={{ fontSize: '12px', color: 'var(--textSoft)', marginTop: '-8px' }}
                >
                  <Flex align="center" gap="2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: password.length >= 8 ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span>At least 8 characters</span>
                  </Flex>
                  <Flex align="center" gap="2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: /[A-Z]/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span>One uppercase letter</span>
                  </Flex>
                  <Flex align="center" gap="2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: /[a-z]/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span>One lowercase letter</span>
                  </Flex>
                  <Flex align="center" gap="2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: /\d/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span>One number</span>
                  </Flex>
                  <Flex align="center" gap="2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#22c55e' : 'var(--textSoftDark)'
                      }}
                    ></div>
                    <span>One special character</span>
                  </Flex>
                </Flex>
              )}
            </Flex>

            <Flex width="100%" mt="4">
              <Button className={styles.submitButton} type="submit" disabled={isLoading || !email || !password}>
                {isLoading ? 'Signing up...' : 'Create Account'}
              </Button>
            </Flex>
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
