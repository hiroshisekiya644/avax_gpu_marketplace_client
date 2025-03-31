'use client'

import { useState, useEffect } from 'react'
import { Flex, Button } from '@radix-ui/themes'
import { useRouter, useParams } from 'next/navigation'
import { getVncUrl } from '@/api/GpuProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

const BackIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="arrow-left" />

const ConsolePage = () => {
  const router = useRouter()
  const params = useParams()
  const vmId = params?.vmId as string

  const [vncUrl, setVncUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVncUrl = async () => {
      if (!vmId) {
        setError('Invalid VM ID')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await getVncUrl(vmId)
        setVncUrl(response.url)
      } catch (err) {
        console.error('Error fetching VNC URL:', err)
        setError(err instanceof Error ? err.message : 'Failed to load console. Please try again.')
        Snackbar({ message: 'Failed to load console', type: 'error' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVncUrl()
  }, [vmId])

  const handleRetry = () => {
    if (!vmId) return

    setIsLoading(true)
    setError(null)

    getVncUrl(vmId)
      .then((response) => {
        setVncUrl(response.url)
      })
      .catch((err) => {
        console.error('Error fetching VNC URL:', err)
        setError(err instanceof Error ? err.message : 'Failed to load console. Please try again.')
        Snackbar({ message: 'Failed to load console', type: 'error' })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>VM Console</div>
            <div className={styles.subTitle}>Access your virtual machine through a secure VNC connection</div>
          </Flex>
          <Button className={styles.backButton} onClick={() => router.push('/dashboard/instances')}>
            <BackIcon />
            Back to Instances
          </Button>
        </Flex>
      </Flex>

      <Flex className={styles.consoleContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingText}>Loading console...</div>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorText}>{error}</div>
            <Button className={styles.retryButton} onClick={handleRetry}>
              Retry
            </Button>
          </div>
        ) : vncUrl ? (
          <>
            <iframe
              src={vncUrl}
              className={styles.consoleFrame}
              title="VM Console"
              allow="clipboard-read; clipboard-write"
            />
            <div className={styles.consoleInfo}>
              <p>
                <span className={styles.consoleInfoHighlight}>Keyboard shortcuts and clipboard</span> may be captured by
                the console. To release keyboard focus, press{' '}
                <span className={styles.consoleInfoHighlight}>Ctrl+Alt</span>.
              </p>
            </div>
          </>
        ) : (
          <div className={styles.errorContainer}>
            <div className={styles.errorText}>No console URL available for this VM.</div>
            <Button className={styles.retryButton} onClick={() => router.push('/dashboard/instances')}>
              Back to Instances
            </Button>
          </div>
        )}
      </Flex>
    </Flex>
  )
}

export default ConsolePage
