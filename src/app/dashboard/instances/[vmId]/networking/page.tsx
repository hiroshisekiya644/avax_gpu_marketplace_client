'use client'

import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Flex, Button, Theme } from '@radix-ui/themes'
import { useRouter, useParams } from 'next/navigation'
import { getGpuAction, attachFloatingIP, detachFloatingIP } from '@/api/GpuProvider'
import { getUserData } from '@/api/User'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { initializeSocket, joinUserRoom } from '@/utils/socket'
import styles from './page.module.css'

// Icons
const BackIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="left-arrow" />
const NetworkIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="network-icon" />
const IpIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="ip-icon" />
const AttachIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="attach-icon" />
const DetachIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="detach-icon" />
const CopyIcon = () => <DynamicSvgIcon height={14} className="rounded-none" iconName="copy-icon" />
const CheckIcon = () => <DynamicSvgIcon height={14} className="rounded-none" iconName="check-icon" />
const InfoIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="info-icon" />
const NoIpIcon = () => <DynamicSvgIcon height={48} className="rounded-none" iconName="no-ip-icon" />

// Define the flavor features interface
interface FlavorFeatures {
  network_optimised: boolean
  no_hibernation: boolean
  no_snapshot: boolean
  local_storage_only: boolean
}

// Define the GPU instance type based on the API response
interface GpuInstance {
  id: number
  user_id: number
  flavor_name: string
  region: string
  instance_id: number | string
  gpu_name: string
  hyperstack_gpu_name: string
  status: string
  flavor_features: FlavorFeatures
  startedAt: string
  is_deleted: boolean
  deleted_at: string | null
  createdAt: string
  updatedAt: string
  public_ip?: string | null
}

// Define the structure of the data received from the socket
interface GpuStatusUpdate {
  instance_id: number | string
  status: string
  public_ip?: string | null
}

const NetworkingPage = () => {
  const router = useRouter()
  const params = useParams()
  const vmId = params?.vmId as string

  const [instance, setInstance] = useState<GpuInstance | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false)
  const [isDetachModalOpen, setIsDetachModalOpen] = useState<boolean>(false)
  const [operationMessage, setOperationMessage] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState<boolean>(false)

  // Fetch instance data
  const fetchInstanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await getGpuAction()

      if (response && response.status === 'success') {
        // Handle both array and single object responses
        const gpuData = Array.isArray(response.gpu) ? response.gpu : [response.gpu]

        // Find the specific instance by ID
        const foundInstance = gpuData.find(
          (inst) => inst.id.toString() === vmId || inst.instance_id.toString() === vmId
        )

        if (foundInstance) {
          // Process the data to convert BUILD status to CREATING
          const processedInstance = {
            ...foundInstance,
            status: foundInstance.status === 'BUILD' ? 'CREATING' : foundInstance.status
          }

          setInstance(processedInstance)
        } else {
          setError('Instance not found')
        }
      } else {
        setError('Failed to fetch instance details')
      }
    } catch (err) {
      console.error('Error fetching instance details:', err)
      setError('Failed to fetch instance details. Please try again.')
      Snackbar({ message: 'Failed to fetch instance details', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [vmId])

  // Set up socket connection for real-time updates
  useEffect(() => {
    // Import socket utilities dynamically to avoid issues
    const setupSocket = async () => {
      try {
        // Get user ID
        const userResponse = await getUserData()
        if (userResponse && userResponse.user && userResponse.user.id) {
          const userId = userResponse.user.id

          // Initialize socket and join user room
          const socket = initializeSocket()
          joinUserRoom(userId)

          // Listen for GPU status updates
          socket.on('gpuStatusUpdate', (data: GpuStatusUpdate) => {
            if (data && data.instance_id && instance) {
              // Check if this update is for our current instance
              if (instance.instance_id.toString() === data.instance_id.toString()) {
                // Update the instance with new data
                setInstance((prevInstance) => {
                  if (!prevInstance) return prevInstance

                  return {
                    ...prevInstance,
                    status: data.status === 'BUILD' ? 'CREATING' : data.status,
                    ...(data.public_ip !== undefined && { public_ip: data.public_ip })
                  }
                })

                // Show notification for IP changes
                if (data.public_ip !== undefined && data.public_ip !== instance.public_ip) {
                  if (data.public_ip) {
                    Snackbar({
                      message: `Public IP ${data.public_ip} has been attached to this instance`,
                      type: 'success'
                    })
                    setOperationMessage(null)
                  } else {
                    Snackbar({
                      message: 'Public IP has been detached from this instance',
                      type: 'info'
                    })
                    setOperationMessage(null)
                  }
                }
              }
            }
          })

          // Return cleanup function
          return () => {
            socket.off('gpuStatusUpdate')
          }
        }
      } catch (error) {
        console.error('Error setting up socket:', error)
      }
    }

    // Set up socket
    const cleanupPromise = setupSocket()

    return () => {
      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup()
      })
    }
  }, [instance])

  // Handle attach public IP
  const handleAttachIp = async () => {
    if (!instance) return

    try {
      setIsProcessing(true)
      setIsAttachModalOpen(false)
      setOperationMessage('Attaching public IP... This may take a few moments.')

      // Show pending message
      Snackbar({
        message: `Attaching public IP to ${instance.gpu_name}...`,
        type: 'info'
      })

      // Call the API
      const response = await attachFloatingIP(instance.instance_id)

      if (response.status === 'success') {
        // Show success message
        Snackbar({
          message: response.result?.message || response.message || 'Public IP attachment initiated',
          type: 'success'
        })

        setOperationMessage('Public IP attachment in progress. This may take a few moments...')

        // Don't immediately refresh - wait for socket update
        // The socket will update the UI when the IP is actually attached
      } else {
        // Show error message
        Snackbar({
          message: response.message || 'Failed to attach public IP',
          type: 'error'
        })
        setOperationMessage(null)
      }
    } catch (error) {
      console.error('Error attaching public IP:', error)
      Snackbar({
        message: error instanceof Error ? error.message : 'Failed to attach public IP',
        type: 'error'
      })
      setOperationMessage(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle detach public IP
  const handleDetachIp = async () => {
    if (!instance || !instance.public_ip) return

    try {
      setIsProcessing(true)
      setIsDetachModalOpen(false)
      setOperationMessage('Detaching public IP... This may take a few moments.')

      // Show pending message
      Snackbar({
        message: `Detaching public IP from ${instance.gpu_name}...`,
        type: 'info'
      })

      // Call the API
      const response = await detachFloatingIP(instance.instance_id)

      if (response.status === 'success') {
        // Show success message
        Snackbar({
          message: response.result?.message || response.message || 'Public IP detachment initiated',
          type: 'success'
        })

        setOperationMessage('Public IP detachment in progress. This may take a few moments...')

        // Don't immediately refresh - wait for socket update
        // The socket will update the UI when the IP is actually detached
      } else {
        // Show error message
        Snackbar({
          message: response.message || 'Failed to detach public IP',
          type: 'error'
        })
        setOperationMessage(null)
      }
    } catch (error) {
      console.error('Error detaching public IP:', error)
      Snackbar({
        message: error instanceof Error ? error.message : 'Failed to detach public IP',
        type: 'error'
      })
      setOperationMessage(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Copy IP to clipboard with fallback
  const copyToClipboard = (text: string) => {
    // Reset copy state
    setIsCopied(false)

    // Check if navigator and clipboard API are available
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      // Modern browsers with Clipboard API
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setIsCopied(true)
          Snackbar({ message: 'IP Address copied to clipboard', type: 'success' })
        })
        .catch((err) => {
          console.error('Could not copy text: ', err)
          fallbackCopyTextToClipboard(text)
        })
    } else {
      // Fallback for browsers without Clipboard API
      fallbackCopyTextToClipboard(text)
    }
  }

  // Fallback method using document.execCommand
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea')
      textArea.value = text

      // Make the textarea out of viewport
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)

      // Select and copy
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        setIsCopied(true)
        Snackbar({ message: 'IP Address copied to clipboard', type: 'success' })
      } else {
        Snackbar({ message: 'Failed to copy to clipboard. Please copy manually.', type: 'error' })
      }
    } catch (err) {
      console.error('Fallback: Could not copy text: ', err)
      Snackbar({
        message: "Your browser doesn't support automatic copying. Please copy manually.",
        type: 'error'
      })
    }
  }

  // Fetch instance data on component mount
  useEffect(() => {
    fetchInstanceData()
  }, [fetchInstanceData])

  // Reset copy state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  // Check if instance is in a state where networking operations are allowed
  const canManageNetworking = instance && ['ACTIVE', 'STOPPED'].includes(instance.status.toUpperCase())

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Network Management</div>
            <div className={styles.subTitle}>Manage public IP addresses for your instance</div>
          </Flex>
          <Button className={styles.backButton} onClick={() => router.push(`/dashboard/instances/${vmId}`)}>
            <BackIcon />
            Back to Instance
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading network information...</div>
        </Flex>
      ) : error ? (
        <Flex className={styles.errorContainer}>
          <div className={styles.errorText}>{error}</div>
          <Button className={styles.retryButton} onClick={fetchInstanceData}>
            Retry
          </Button>
        </Flex>
      ) : instance ? (
        <div className={styles.networkContainer}>
          <div className={styles.networkHeader}>
            <div className={styles.networkTitle}>
              <NetworkIcon />
              Network Settings for {instance.gpu_name}
            </div>
          </div>

          {operationMessage && (
            <div className={styles.operationMessage}>
              <div className={styles.operationSpinner}></div>
              {operationMessage}
            </div>
          )}

          <div className={styles.networkContent}>
            <div className={styles.networkSection}>
              <div className={styles.sectionTitle}>
                <IpIcon /> Public IP Addresses
              </div>

              <div className={styles.ipStatusContainer}>
                {instance.public_ip ? (
                  <div className={styles.ipStatusRow}>
                    <div className={styles.ipInfo}>
                      <div className={styles.ipAddress}>
                        {instance.public_ip}
                        <button
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(instance.public_ip || '')}
                          aria-label={isCopied ? 'Copied' : 'Copy IP Address'}
                          title={isCopied ? 'Copied' : 'Copy to clipboard'}
                        >
                          {isCopied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                        <span className={`${styles.statusBadge} ${styles.statusActive}`}>Attached</span>
                      </div>
                      <div className={styles.ipStatus}>Attached to {instance.gpu_name}</div>
                    </div>
                    <div className={styles.ipActions}>
                      <Button
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => setIsDetachModalOpen(true)}
                        disabled={isProcessing || !canManageNetworking}
                        title={!canManageNetworking ? 'Instance must be active or stopped to manage networking' : ''}
                      >
                        <DetachIcon />
                        Detach IP
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.noIpContainer}>
                    <div className={styles.noIpIcon}>
                      <NoIpIcon />
                    </div>
                    <div className={styles.noIpText}>No public IP address is attached to this instance</div>
                    <Button
                      className={`${styles.actionButton} ${styles.primaryButton}`}
                      onClick={() => setIsAttachModalOpen(true)}
                      disabled={isProcessing || !canManageNetworking}
                      title={!canManageNetworking ? 'Instance must be active or stopped to manage networking' : ''}
                    >
                      <AttachIcon />
                      Attach Public IP
                    </Button>
                  </div>
                )}
              </div>

              <div className={styles.infoText}>
                <span className={styles.infoIconWrapper}>
                  <InfoIcon />
                </span>
                Public IP addresses allow your instance to be accessible from the internet. You can attach one public IP
                per instance.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Flex className={styles.errorContainer}>
          <div className={styles.errorText}>Instance not found</div>
          <Button className={styles.retryButton} onClick={() => router.push('/dashboard/instances')}>
            Back to Instances
          </Button>
        </Flex>
      )}

      {/* Attach IP Confirmation Modal */}
      <Dialog.Root open={isAttachModalOpen} onOpenChange={setIsAttachModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Attach Public IP</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Are you sure you want to attach a public IP address to {instance?.gpu_name}? This will make your
                instance accessible from the internet.
              </Dialog.Description>

              <Flex justify="end" gap="3" mt="4">
                <Button
                  className={styles.cancelButton}
                  onClick={() => setIsAttachModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button className={styles.confirmButton} onClick={handleAttachIp} disabled={isProcessing}>
                  {isProcessing ? 'Attaching...' : 'Attach IP'}
                </Button>
              </Flex>
            </Theme>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Detach IP Confirmation Modal */}
      <Dialog.Root open={isDetachModalOpen} onOpenChange={setIsDetachModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Detach Public IP</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Are you sure you want to detach the public IP address from {instance?.gpu_name}? This will make your
                instance inaccessible from the internet.
              </Dialog.Description>

              <Flex justify="end" gap="3" mt="4">
                <Button
                  className={styles.cancelButton}
                  onClick={() => setIsDetachModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button className={styles.confirmButton} onClick={handleDetachIp} disabled={isProcessing}>
                  {isProcessing ? 'Detaching...' : 'Detach IP'}
                </Button>
              </Flex>
            </Theme>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default NetworkingPage
