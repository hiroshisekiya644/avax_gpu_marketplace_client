'use client'

import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Flex, Button, Theme } from '@radix-ui/themes'
import { useRouter, useParams } from 'next/navigation'
import { manageVM, deleteVM, getGpuAction } from '@/api/GpuProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import LoadingSpinner from '@/components/loading/LoadingSpinner'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

// Add these styles to the existing styles
// Remove this unused object
// const customStyles = {
//   disabledButton: "opacity-50 cursor-not-allowed",
//   disabledFeatureIndicator: "text-xs ml-1 text-red-400 font-normal",
// }

// Icons
const BackIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="left-arrow" />
const ConsoleIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="external-link" />
const StartIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="play-icon" />
const StopIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="stop-icon" />
const RestartIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="refresh-icon" />
const HibernateIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="hibernate-icon" />
const RestoreIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="restore-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="trash-icon" />
const InfoIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="info-icon" />
const CopyIcon = () => <DynamicSvgIcon height={14} className="rounded-none" iconName="copy-icon" />
const ServerIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="server-icon" />
const ClockIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="clock-icon" />
const FeaturesIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="features-icon" />
// Remove this unused icon component
// const StatusIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="status-icon" />
const NetworkIcon = () => <DynamicSvgIcon height={16} className="rounded-none" iconName="network-icon" />

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

// Define a proper type for the socket data
interface GpuStatusUpdate {
  instance_id: string | number
  status: string
  public_ip?: string | null
}

const InstanceDetailsPage = () => {
  const router = useRouter()
  const params = useParams()
  const vmId = params?.vmId as string

  const [instance, setInstance] = useState<GpuInstance | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  // Remove this line
  // const [copiedText, setCopiedText] = useState<string | null>(null)

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

  // Format date to a more readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'

    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge color based on status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return styles.statusActive
      case 'DELETED':
        return styles.statusDeleted
      case 'PENDING':
      case 'BUILD':
      case 'CREATING':
        return styles.statusPending
      case 'ERROR':
        return styles.statusError
      case 'HIBERNATED':
        return styles.statusHibernated
      default:
        return styles.statusDefault
    }
  }

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <DynamicSvgIcon height={14} className="rounded-none" iconName="check-circle" />
      case 'DELETED':
        return <DynamicSvgIcon height={14} className="rounded-none" iconName="x-circle" />
      case 'PENDING':
      case 'BUILD':
      case 'CREATING':
        return <LoadingSpinner size="small" color="var(--button)" className={styles.statusSpinner} />
      case 'ERROR':
        return <DynamicSvgIcon height={14} className="rounded-none" iconName="alert-circle" />
      case 'HIBERNATED':
        return <DynamicSvgIcon height={14} className="rounded-none" iconName="moon-icon" />
      default:
        return <DynamicSvgIcon height={14} className="rounded-none" iconName="info-icon" />
    }
  }

  // Handle instance actions (start, stop, reboot, etc.)
  const handleInstanceAction = async (action: string) => {
    if (!instance) return

    // Map the action to the API action
    const ACTION_MAP: Record<string, string> = {
      start: 'start',
      stop: 'stop',
      restart: 'hard-reboot',
      hibernate: 'hibernate',
      restore: 'hibernate-restore'
    }

    const apiAction = ACTION_MAP[action]
    if (!apiAction) {
      Snackbar({ message: `Unknown action: ${action}`, type: 'error' })
      return
    }

    // Map actions to messages
    const ACTION_MESSAGES: Record<string, { pending: string; success: string; error: string }> = {
      start: {
        pending: 'Starting',
        success: 'Started',
        error: 'Failed to start'
      },
      stop: {
        pending: 'Stopping',
        success: 'Stopped',
        error: 'Failed to stop'
      },
      restart: {
        pending: 'Restarting',
        success: 'Restarted',
        error: 'Failed to restart'
      },
      hibernate: {
        pending: 'Hibernating',
        success: 'Hibernated',
        error: 'Failed to hibernate'
      },
      restore: {
        pending: 'Restoring',
        success: 'Restored',
        error: 'Failed to restore'
      }
    }

    try {
      setIsProcessing(true)

      // Show pending message
      const actionMessages = ACTION_MESSAGES[action]
      Snackbar({
        message: `${actionMessages.pending} ${instance.gpu_name}...`,
        type: 'info'
      })

      // Call the API with the appropriate action and parameters
      const response = await manageVM(apiAction, {
        vmId: instance.instance_id
      })

      if (response.status === 'success') {
        // Show success message
        Snackbar({
          message: `${actionMessages.success} ${instance.gpu_name} successfully`,
          type: 'success'
        })

        // Refresh the instance data after a short delay
        setTimeout(() => {
          fetchInstanceData()
        }, 1000)
      } else {
        // Show error message from the API
        Snackbar({
          message: response.message || `${actionMessages.error} ${instance.gpu_name}`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error)

      // Show error message
      const actionMessages = ACTION_MESSAGES[action]
      Snackbar({
        message: error instanceof Error ? error.message : `${actionMessages.error} ${instance.gpu_name}`,
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle instance deletion
  const handleDeleteInstance = async () => {
    if (!instance) return

    try {
      setIsProcessing(true)

      // Show pending message
      Snackbar({
        message: `Deleting ${instance.gpu_name}...`,
        type: 'info'
      })

      // Call the delete API
      const response = await deleteVM(instance.id, { force: true })

      if (response.status === 'success') {
        // Show success message
        Snackbar({
          message: `Deleted ${instance.gpu_name} successfully`,
          type: 'success'
        })

        // Close the modal
        setIsDeleteModalOpen(false)

        // Navigate back to instances list after a short delay
        setTimeout(() => {
          router.push('/dashboard/instances')
        }, 1000)
      } else {
        // Show error message from the API
        Snackbar({
          message: response.message || `Failed to delete ${instance.gpu_name}`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error during delete:', error)

      // Show error message
      Snackbar({
        message: error instanceof Error ? error.message : `Failed to delete ${instance.gpu_name}`,
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteModalOpen(false)
    }
  }

  // Navigate to console page
  const navigateToConsole = () => {
    if (!instance) return

    if (instance.status.toUpperCase() !== 'ACTIVE') {
      Snackbar({
        message: 'Console is only available for active instances',
        type: 'info'
      })
      return
    }

    router.push(`/dashboard/instances/${instance.instance_id}/console`)
  }

  // Navigate to networking page
  const navigateToNetworking = () => {
    if (!instance) return
    router.push(`/dashboard/instances/${instance.instance_id}/networking`)
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Remove this line
        // setCopiedText(label)
        Snackbar({ message: `${label} copied to clipboard`, type: 'success' })
        // Remove this line
        // setTimeout(() => setCopiedText(null), 2000)
      },
      (err) => {
        console.error('Could not copy text: ', err)
        Snackbar({ message: 'Failed to copy to clipboard', type: 'error' })
      }
    )
  }

  // Set up socket connection for real-time updates
  useEffect(() => {
    // Import socket utilities dynamically to avoid issues
    const setupSocket = async () => {
      try {
        const { initializeSocket, joinUserRoom } = await import('@/utils/socket')
        const { getUserData } = await import('@/api/User')

        // Get user ID
        const userResponse = await getUserData()
        if (userResponse && userResponse.user && userResponse.user.id) {
          const userId = userResponse.user.id

          // Initialize socket and join user room
          const socket = initializeSocket()
          joinUserRoom(userId)

          // Listen for GPU status updates
          socket.on('gpuStatusUpdate', (data: GpuStatusUpdate) => {
            if (
              data &&
              data.instance_id &&
              instance &&
              instance.instance_id.toString() === data.instance_id.toString()
            ) {
              // Update the instance with new status
              setInstance((prev) => {
                if (!prev) return prev
                return {
                  ...prev,
                  status: data.status === 'BUILD' ? 'CREATING' : data.status,
                  ...(data.public_ip !== undefined && { public_ip: data.public_ip })
                }
              })
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

    // Set up socket if we have an instance
    if (instance) {
      const cleanupPromise = setupSocket()
      return () => {
        cleanupPromise.then((cleanup) => {
          if (cleanup) cleanup()
        })
      }
    }
  }, [instance])

  // Fetch instance data on component mount
  useEffect(() => {
    fetchInstanceData()
  }, [fetchInstanceData])

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Instance Details</div>
            <div className={styles.subTitle}>View and manage your GPU instance</div>
          </Flex>
          <Button className={styles.backButton} onClick={() => router.push('/dashboard/instances')}>
            <BackIcon />
            Back to Instances
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <Flex className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading instance details...</div>
        </Flex>
      ) : error ? (
        <Flex className={styles.errorContainer}>
          <div className={styles.errorText}>{error}</div>
          <Button className={styles.retryButton} onClick={fetchInstanceData}>
            Retry
          </Button>
        </Flex>
      ) : instance ? (
        <div className={styles.detailsContainer}>
          <div className={styles.detailsHeader}>
            <div className={styles.detailsTitle}>
              <ServerIcon />
              {instance.gpu_name}
              <span className={`${styles.statusBadge} ${getStatusColor(instance.status)}`}>
                {getStatusIcon(instance.status)} {instance.status}
              </span>
            </div>
          </div>
          <div className={styles.detailsContent}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailsSection}>
                <div className={styles.sectionTitle}>
                  <InfoIcon /> Instance Information
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>GPU Type</div>
                  <div className={styles.detailsValue}>{instance.flavor_name}</div>
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>Region</div>
                  <div className={styles.detailsValue}>{instance.region}</div>
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>Instance ID</div>
                  <div className={styles.detailsValue}>{instance.instance_id}</div>
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>IP Address</div>
                  <div className={styles.detailsValue}>
                    {instance.public_ip || '-'}
                    {instance.public_ip && (
                      <button
                        className={styles.copyButton}
                        onClick={() => copyToClipboard(instance.public_ip || '', 'IP Address')}
                        aria-label="Copy IP Address"
                      >
                        <CopyIcon />
                      </button>
                    )}
                    <Button
                      className={styles.secondaryButton}
                      style={{ marginLeft: '10px', height: '30px', fontSize: '12px' }}
                      onClick={navigateToNetworking}
                    >
                      <NetworkIcon />
                      Manage Network
                    </Button>
                  </div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <div className={styles.sectionTitle}>
                  <ClockIcon /> Timestamps
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>Created</div>
                  <div className={styles.detailsValue}>{formatDate(instance.createdAt)}</div>
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>Started</div>
                  <div className={styles.detailsValue}>{formatDate(instance.startedAt)}</div>
                </div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>Last Updated</div>
                  <div className={styles.detailsValue}>{formatDate(instance.updatedAt)}</div>
                </div>
                {instance.is_deleted && (
                  <div className={styles.detailsRow}>
                    <div className={styles.detailsLabel}>Deleted</div>
                    <div className={styles.detailsValue}>{formatDate(instance.deleted_at)}</div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.detailsSection}>
              <div className={styles.sectionTitle}>
                <FeaturesIcon /> Features
              </div>
              <Flex wrap="wrap" gap="2" style={{ marginBottom: '16px' }}>
                <span
                  className={`${styles.featureBadge} ${instance.flavor_features?.network_optimised ? styles.featureEnabled : styles.featureDisabled}`}
                >
                  {instance.flavor_features?.network_optimised ? 'Network Optimized' : 'Standard Network'}
                </span>
                <span
                  className={`${styles.featureBadge} ${!instance.flavor_features?.no_hibernation ? styles.featureEnabled : styles.featureDisabled}`}
                >
                  {instance.flavor_features?.no_hibernation ? 'No Hibernation' : 'Hibernation Support'}
                </span>
                <span
                  className={`${styles.featureBadge} ${!instance.flavor_features?.no_snapshot ? styles.featureEnabled : styles.featureDisabled}`}
                >
                  {instance.flavor_features?.no_snapshot ? 'No Snapshot' : 'Snapshot Support'}
                </span>
                <span
                  className={`${styles.featureBadge} ${!instance.flavor_features?.local_storage_only ? styles.featureEnabled : styles.featureDisabled}`}
                >
                  {instance.flavor_features?.local_storage_only ? 'Local Storage Only' : 'Network Storage'}
                </span>
              </Flex>
            </div>

            {!instance.is_deleted && (
              <div className={styles.actionsContainer}>
                {instance.status.toUpperCase() === 'ACTIVE' ? (
                  <>
                    <Button
                      className={`${styles.actionButton} ${styles.primaryButton}`}
                      onClick={navigateToConsole}
                      disabled={isProcessing}
                    >
                      <ConsoleIcon />
                      Open Console
                    </Button>
                    <Button
                      className={`${styles.actionButton} ${styles.secondaryButton}`}
                      onClick={() => handleInstanceAction('stop')}
                      disabled={isProcessing}
                    >
                      <StopIcon />
                      Stop
                    </Button>
                    <Button
                      className={`${styles.actionButton} ${styles.secondaryButton}`}
                      onClick={() => handleInstanceAction('restart')}
                      disabled={isProcessing}
                    >
                      <RestartIcon />
                      Restart
                    </Button>
                    <Button
                      className={`${styles.actionButton} ${styles.secondaryButton} ${
                        instance.flavor_features?.no_hibernation ? styles.disabledButton : ''
                      }`}
                      onClick={() => handleInstanceAction('hibernate')}
                      disabled={isProcessing || instance.flavor_features?.no_hibernation === true}
                      title={
                        instance.flavor_features?.no_hibernation ? 'Hibernation not supported for this instance' : ''
                      }
                      style={{
                        cursor: instance.flavor_features?.no_hibernation ? 'default' : 'pointer'
                      }}
                    >
                      <HibernateIcon />
                      Hibernate
                    </Button>
                  </>
                ) : instance.status.toUpperCase() === 'HIBERNATED' ? (
                  <>
                    <Button
                      className={`${styles.actionButton} ${styles.primaryButton}`}
                      onClick={() => handleInstanceAction('restore')}
                      disabled={isProcessing}
                    >
                      <RestoreIcon />
                      Restore
                    </Button>
                  </>
                ) : instance.status.toUpperCase() !== 'DELETED' &&
                  instance.status.toUpperCase() !== 'ERROR' &&
                  instance.status.toUpperCase() !== 'CREATING' ? (
                  <>
                    <Button
                      className={`${styles.actionButton} ${styles.primaryButton}`}
                      onClick={() => handleInstanceAction('start')}
                      disabled={isProcessing}
                    >
                      <StartIcon />
                      Start
                    </Button>
                  </>
                ) : null}

                {!instance.is_deleted && (
                  <Button
                    className={`${styles.actionButton} ${styles.dangerButton}`}
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isProcessing}
                  >
                    <DeleteIcon />
                    Delete
                  </Button>
                )}
              </div>
            )}
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

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Confirm Delete</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Are you sure you want to delete {instance?.gpu_name}? This action cannot be undone.
              </Dialog.Description>

              <Flex justify="end" gap="3" mt="4">
                <Button
                  className={styles.cancelButton}
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button className={styles.deleteButton} onClick={handleDeleteInstance} disabled={isProcessing}>
                  {isProcessing ? 'Deleting...' : 'Delete'}
                </Button>
              </Flex>
            </Theme>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default InstanceDetailsPage
