'use client'
import React, { useState } from 'react'
import { EyeOpenIcon } from '@radix-ui/react-icons'
import { Flex, Button } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authenticateAction, AuthData, AuthResponse } from '@/api/Auth'
import { AuthInput } from '@/components/input/AuthInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

const Login = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const userData: AuthData = { email, password }

    try {
      const response: AuthResponse = await authenticateAction('signin', userData)
      Snackbar({ message: 'You have successfully logged in!' })

      sessionStorage.setItem('authToken', response.accessToken)
      // sessionStorage.setItem('userId', response.userId.toString())
      router.push('/dashboard/create-cluster')
    } catch (error: unknown) {
      if (error instanceof Error) {
        Snackbar({ message: error.message })
      } else {
        Snackbar({ message: 'An unknown error occurred' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex className={styles.bg}>
      <div className={styles.card}>
        <Flex direction="column" gap="4" justify="center" align="center">
          <Flex gap="4">
            <Image src="/logo/logo.avif" alt="Logo" width={22} height={22} className={styles.imageButton} priority />
            <Flex className={styles.title}>AVAX GPU MARKETPLACE</Flex>
          </Flex>
          <Flex className={styles.text}>Welcome</Flex>
          <Flex className={styles.subText}>Log in to AVAX GPU marketplace to continue to Compute Platform.</Flex>

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <Flex direction="column" gap="4" mt="2" pt="2">
              <AuthInput
                id="email"
                label="Email Address *"
                placeholder="Email Address*"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <AuthInput
                id="password"
                label="Password *"
                placeholder="Password*"
                type="password"
                icon={<EyeOpenIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Flex>

            <Flex width="100%" mt="4">
              <Button className={styles.submitButton} type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Continue'}
              </Button>
            </Flex>
          </form>

          <Flex gap="4" align="center" justify="start" width="100%">
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
