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
import { EMAIL_REGEX, PASSWORD_REGEX } from '@/utils/Regex'
import styles from './../login/page.module.css'

const SignUp = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!EMAIL_REGEX.test(email)) {
      Snackbar({ message: 'Please provide valid email address.' })
      setIsLoading(false)
      return
    }

    if (!PASSWORD_REGEX.test(password)) {
      Snackbar({
        message: 'Password must be at least 8 characters, contain uppercase, lowercase, number, and special character'
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
            <Image src="/logo/logo.jpg" alt="Logo" width={32} height={32} className={styles.imageButton} priority />
            <Flex className={styles.title}>rLoop GPU MARKETPLACE</Flex>
          </Flex>
          <Flex className={styles.text}>Welcome</Flex>
          <Flex className={styles.subText}>Sign up to rLoop GPU marketplace to continue to Compute Platform.</Flex>

          <form onSubmit={handleSignUp} style={{ width: '100%' }}>
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
                {isLoading ? 'Signing up...' : 'Continue'}
              </Button>
            </Flex>
          </form>

          <Flex gap="4" align="center" justify="start" width="100%">
            <Flex className={styles.subText}>Already have an account?</Flex>
            <Link href="/auth/login">
              <Flex className={styles.subTextButton}>Log In</Flex>
            </Link>
          </Flex>
        </Flex>
      </div>
    </Flex>
  )
}

export default SignUp
