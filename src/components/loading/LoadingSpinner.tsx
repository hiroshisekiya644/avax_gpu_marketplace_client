'use client'

import type React from 'react'
import styles from './LoadingSpinner.module.css'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'var(--button)',
  className = ''
}) => {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '40px'
  }

  const spinnerSize = sizeMap[size]

  return (
    <div
      className={`${styles.spinner} ${className}`}
      style={{
        width: spinnerSize,
        height: spinnerSize,
        borderTopColor: color
      }}
    />
  )
}

export default LoadingSpinner
