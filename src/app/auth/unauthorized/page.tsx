'use client'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

const UnAuthorized = () => {
  const router = useRouter()
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>rLoop GPU Marketplace</h1>
        <p className={styles.message}>You are not authorized. Please sign in first...</p>
        <button className={styles.signInButton} onClick={() => router.push('/auth/login')}>
          SIGN IN
        </button>
      </div>
    </div>
  )
}

export default UnAuthorized
