'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Flex, Button } from '@radix-ui/themes'
import { useRouter, useParams } from 'next/navigation'
import { manageVM, deleteVM } from '@/api/GpuProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useGpuInstances } from '@/context/GpuInstanceContext'
import styles from './page.module.css'

const BackIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="left-arrow" />
const ConsoleIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="external-link" />
const StartIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="play-icon" />
const StopIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="stop-icon" />
const RestartIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="refresh-icon" />
const HibernateIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="hibernate-icon" />
const RestoreIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="restore-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="trash-icon" />

const InstanceDetailsPage = () => {
  const router = useRouter()
  const params = useParams()
  const vmId = params?.vmId as string

  // Use the shared GPU instances context
  const { getInstance, refreshInstances, isLoading: contextLoading, error: contextError } = useGpuInstances()

  const [instance, setInstance] = useState(getInstance(vmId))
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)

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

        // Refresh the instances list after a short delay
        setTimeout(() => {
          refreshInstances()
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

  // Update the instance when it changes in the context
  useEffect(() => {
    setInstance(getInstance(vmId))
  }, [vmId, getInstance])

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

      {contextLoading ? (
        <Flex className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading instance details...</div>
        </Flex>
      ) : contextError ? (
        <Flex className={styles.errorContainer}>
          <div className={styles.errorText}>{contextError}</div>
          <Button className={styles.retryButton} onClick={refreshInstances}>
            Retry
          </Button>
        </Flex>
      ) : instance ? (
        <div className={styles.detailsContainer}>
          <div className={styles.detailsHeader}>
            <div className={styles.detailsTitle}>{instance.gpu_name}</div>
          </div>
          <div className={styles.detailsContent}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailsSection}>
                <div className={styles.sectionTitle}>Instance Information</div>
                <div className={styles.detailsRow}>
                  <div className={styles.detailsLabel}>Status</div>
                  <div className={styles.detailsValue}>
                    <span className={`${styles.statusBadge} ${getStatusColor(instance.status)}`}>
                      {instance.status}
                    </span>
                  </div>
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
                  <div className={styles.detailsValue}>{instance.public_ip || '-'}</div>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <div className={styles.sectionTitle}>Timestamps</div>
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
              <div className={styles.sectionTitle}>Features</div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Network Optimized</div>
                <div className={styles.detailsValue}>{instance.flavor_features?.network_optimised ? 'Yes' : 'No'}</div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Hibernation</div>
                <div className={styles.detailsValue}>
                  {instance.flavor_features?.no_hibernation ? 'Not Supported' : 'Supported'}
                </div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Snapshot</div>
                <div className={styles.detailsValue}>
                  {instance.flavor_features?.no_snapshot ? 'Not Supported' : 'Supported'}
                </div>
              </div>
              <div className={styles.detailsRow}>
                <div className={styles.detailsLabel}>Storage Type</div>
                <div className={styles.detailsValue}>
                  {instance.flavor_features?.local_storage_only ? 'Local Storage Only' : 'Network Storage Available'}
                </div>
              </div>
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
                      Console
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
                      className={`${styles.actionButton} ${styles.secondaryButton}`}
                      onClick={() => handleInstanceAction('hibernate')}
                      disabled={isProcessing || instance.flavor_features?.no_hibernation === true}
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default InstanceDetailsPage
