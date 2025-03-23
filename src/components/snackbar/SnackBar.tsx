'use client'
import toast from 'react-hot-toast'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import styles from './SnackBar.module.css'

const Cross = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="cross" />
const DialogCheck = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="dialogCheck" />
const AlertIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="alert-circle" />

interface SnackbarProps {
  message: string
  linkText?: string
  linkHref?: string
  type?: 'success' | 'error' | 'info'
}

export const Snackbar = ({ message, linkText, linkHref, type = 'success' }: SnackbarProps) => {
  const mediaQuery = window.matchMedia('(max-width: 768px)')

  const Icon = type === 'error' ? AlertIcon : DialogCheck

  toast(
    (t) => (
      <div className={`${styles.toast} ${type === 'error' ? styles.errorToast : ''}`}>
        <div className={styles.toastLeft}>
          <Icon />
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
        background: type === 'error' ? 'rgb(87 29 29)' : 'rgb(8 29 87)',
        color: '#ffffff',
        width: mediaQuery.matches ? '320px' : '400px',
        maxWidth: '400px',
        padding: '16px 12px',
        borderRadius: '10px',
        alignItems: 'center'
      },
      position: mediaQuery.matches ? 'bottom-center' : 'top-right',
      duration: type === 'error' ? 5000 : 3000
    }
  )
}
