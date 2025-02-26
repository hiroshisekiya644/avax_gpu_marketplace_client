import React from 'react'
import toast from 'react-hot-toast'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import styles from './SnackBar.module.css'

const Cross = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="cross" />
const DialogCheck = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="dialogCheck" />

export const Snackbar = ({
  message,
  linkText,
  linkHref
}: {
  message: string
  linkText?: string
  linkHref?: string
}) => {
  const mediaQuery = window.matchMedia('(max-width: 768px)')

  toast(
    (t) => (
      <div className={styles.toast}>
        <div className={styles.toastLeft}>
          <DialogCheck />
          <span className={styles.text}>
            {message}
            {linkText && linkHref && (
              <a href={linkHref} className={styles.link} target="_blank" rel="noopener noreferrer">
                {linkText}
              </a>
            )}
          </span>
        </div>
        <button className={styles.close} onClick={() => toast.dismiss(t.id)}>
          <Cross />
        </button>
      </div>
    ),
    {
      style: {
        background: 'rgb(8 29 87)',
        color: '#ffffff',
        width: mediaQuery.matches ? '320px' : '400px',
        maxWidth: '400px',
        padding: '16px 12px',
        borderRadius: '10px',
        alignItems: 'center'
      },
      position: mediaQuery.matches ? 'bottom-center' : 'top-right'
    }
  )
}
