'use client'

import type React from 'react'
import { Flex } from '@radix-ui/themes'
import styles from './LoadingSpinner.module.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...'}) => {
  return (
    <Flex className={styles.container}>
      <div className={styles.spinnerBox}>
        <div className={styles.spinner}></div>
        <div className={styles.message}>{message}</div>
      </div>
    </Flex>
  )
}

export default LoadingSpinner
