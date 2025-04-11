import React from 'react'
import Link from 'next/link'
import styles from './Button.module.css'
// import Line from '@/components/icon/Line.svg'

type Props = {
  name?: string
  disabled?: boolean
  fullWidth?: boolean
  variant?: 'line' | 'black' | 'white' | 'gray' | 'orange'
  asLink?: boolean
  href?: string
  onClick?: () => void
} & Omit<JSX.IntrinsicElements['button'], 'className' | 'children'>

export const Button = (props: Props) => {
  const { name, disabled, fullWidth, variant = 'black', asLink, href, onClick, ...rest } = props

  const className = `${styles.button} ${fullWidth ? styles.fullWidth : ''} ${styles[variant]}`

  const content = (
    <>
      {/* {variant === 'line' && <Line />} */}
      {name}
    </>
  )

  if (asLink) {
    return (
      <Link href={href ?? ''} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button className={className} disabled={disabled} onClick={onClick} {...rest}>
      {content}
    </button>
  )
}
