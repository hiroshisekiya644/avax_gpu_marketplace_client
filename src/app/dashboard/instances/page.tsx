'use client'
import { useState, useEffect, useCallback } from 'react'
import type React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Flex, Button, Table, Link } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import { getGpuAction, manageVM, deleteVM } from '@/api/GpuProvider'
import { getUserData } from '@/api/User'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, type SelectItem } from '@/components/select/FormSelect'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useBalance } from '@/context/BalanceContext'
import { initializeSocket, joinUserRoom } from '@/utils/socket'
import styles from './page.module.css'

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
}

// Update the GpuResponse interface to correctly define gpu as an array
// Remove the unused GpuResponse interface

const GpuIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="gpu-icon" />
const HistoryIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="history-icon" />
const RefreshIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="refresh-icon" />
const ExternalLink = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="external-link" />
const WalletIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="wallet-icon" />

type TabValue = 'instances' | 'history'
const tabValues: TabValue[] = ['instances', 'history']
const tabListItems = [
  { name: 'Instances', icon: <GpuIcon />, value: 'instances' },
  { name: 'History', icon: <HistoryIcon />, value: 'history' }
]

// Headers for the instances tab
const instancesTableHeaderItems = ['NAME', 'GPU', 'REGION', 'STATUS', 'CREATED', 'CONSOLE', 'ACTIONS']

// Headers for the history tab (with DELETED DATE instead of CONSOLE)
const historyTableHeaderItems = ['NAME', 'GPU', 'REGION', 'STATUS', 'CREATED', 'DELETED DATE', 'ACTIONS']

const Instances = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>(tabValues[0])
  const [gpuInstances, setGpuInstances] = useState<GpuInstance[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [tableLoading, setTableLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [processingInstances, setProcessingInstances] = useState<Record<number, boolean>>({})
  const [userId, setUserId] = useState<number | null>(null)

  // Use the balance context instead of local state
  const { balance, isLoading: balanceLoading } = useBalance()

  // Add state for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [instanceToDelete, setInstanceToDelete] = useState<GpuInstance | null>(null)

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Format date to yyyy/mm/dd format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}/${month}/${day}`
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
      default:
        return styles.statusDefault
    }
  }

  // Removing the unused renderFeatureBadges function
  // This functionality will be implemented in the future when we add feature badges to the UI

  // Fetch user data to get the user ID
  const fetchUserData = useCallback(async () => {
    try {
      const response = await getUserData()
      if (response && response.user) {
        setUserId(response.user.id)
        return response.user.id
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
    return null
  }, [])

  // Initialize socket connection and join user room
  const setupSocket = useCallback(async () => {
    try {
      // Get user ID if not already set
      const currentUserId = userId || (await fetchUserData())
      if (!currentUserId) return undefined

      // Initialize socket and join user room
      const socket = initializeSocket()
      joinUserRoom(currentUserId)

      // Listen for GPU status updates
      socket.on('gpuStatusUpdate', (data) => {
        console.log('Received GPU status update:', data)

        // Update the specific instance in the state without refetching everything
        setGpuInstances((prevInstances) => {
          return prevInstances.map((instance) => {
            if (instance.instance_id === data.instance_id) {
              // Create updated instance with new status
              const updatedInstance = {
                ...instance,
                // Update any other fields that might be in the data
                ...(data.public_ip && { public_ip: data.public_ip })
              }

              // Set status, converting BUILD to CREATING for display purposes
              updatedInstance.status = data.status === 'BUILD' ? 'CREATING' : data.status

              return updatedInstance
            }
            return instance
          })
        })
      })

      // Return a cleanup function
      return () => {
        socket.off('gpuStatusUpdate')
      }
    } catch (error) {
      console.error('Error setting up socket:', error)
      return undefined
    }
  }, [userId, fetchUserData])

  // Also update the initial data processing to convert BUILD to CREATING
  const fetchGpuInstances = async (initialLoad = false) => {
    try {
      // Only set the main loading state on initial load
      if (initialLoad) {
        setIsLoading(true)
      } else {
        // For refresh button clicks, only set the table loading state
        setTableLoading(true)
      }

      setError(null)
      const response = await getGpuAction()

      if (response && response.status === 'success') {
        // Handle both array and single object responses
        const gpuData = Array.isArray(response.gpu) ? response.gpu : [response.gpu]

        // Process the data to convert BUILD status to CREATING
        const processedData = gpuData.map((instance) => ({
          ...instance,
          status: instance.status === 'BUILD' ? 'CREATING' : instance.status
        }))

        // Sort instances by creation date (newest first)
        const sortedInstances = [...processedData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setGpuInstances(sortedInstances)
      } else {
        setError('Failed to fetch GPU instances')
      }
    } catch (err) {
      console.error('Error fetching GPU instances:', err)
      setError('Failed to fetch GPU instances. Please try again.')
      Snackbar({ message: 'Failed to fetch GPU instances', type: 'error' })
    } finally {
      setIsLoading(false)
      setTableLoading(false)
    }
  }

  // Navigate to console page for an instance
  const navigateToConsole = (instance: GpuInstance) => {
    if (instance.status.toUpperCase() !== 'ACTIVE') {
      Snackbar({
        message: 'Console is only available for active instances',
        type: 'info'
      })
      return
    }

    // Navigate to the console page with the instance ID
    router.push(`/dashboard/instances/${instance.instance_id}/console`)
  }

  // Get action items for an instance
  const getActionItems = (instance: GpuInstance): SelectItem[] => {
    // Check if the instance is being processed
    const isProcessing = processingInstances[instance.id] === true
    const isActive = instance.status.toUpperCase() === 'ACTIVE'

    // Start with the placeholder item
    const items: SelectItem[] = [{ label: 'Actions', name: 'placeholder', disabled: true }]

    // Only add start button if instance is not active
    if (!isActive) {
      items.push({
        label: 'Start',
        name: 'start',
        disabled: isProcessing
      })
    } else {
      // Add stop button if instance is active
      items.push({
        label: 'Stop',
        name: 'stop',
        disabled: isProcessing
      })
    }

    // Add hard-reboot only for active instances
    if (isActive) {
      items.push({
        label: 'Hard Reboot',
        name: 'hard-reboot',
        disabled: isProcessing
      })
    }

    // Always add hibernate option, but disable it if no_hibernation is true or instance is not active
    items.push({
      label: 'Hibernate',
      name: 'hibernate',
      disabled: isProcessing || instance.flavor_features?.no_hibernation === true || !isActive
    })

    // Add divider and delete option
    items.push(
      { label: '', name: 'divider', disabled: true },
      { label: 'Delete', name: 'delete', className: 'selectItemDelete', disabled: isProcessing }
    )

    return items
  }

  // Map UI action names to API action parameters
  const ACTION_MAP: Record<string, string> = {
    start: 'start',
    stop: 'stop',
    'hard-reboot': 'hard-reboot',
    hibernate: 'hibernate'
  }

  // Map action names to user-friendly messages
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
    'hard-reboot': {
      pending: 'Rebooting',
      success: 'Rebooted',
      error: 'Failed to reboot'
    },
    hibernate: {
      pending: 'Hibernating',
      success: 'Hibernated',
      error: 'Failed to hibernate'
    },
    delete: {
      pending: 'Deleting',
      success: 'Deleted',
      error: 'Failed to delete'
    }
  }

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!instanceToDelete) return

    try {
      // Mark this instance as processing
      setProcessingInstances((prev) => ({ ...prev, [instanceToDelete.id]: true }))

      // Show pending message
      const actionMessages = ACTION_MESSAGES['delete']
      Snackbar({
        message: `${actionMessages.pending} ${instanceToDelete.gpu_name}...`,
        type: 'info'
      })

      // Call the dedicated delete API function
      const response = await deleteVM(instanceToDelete.id, { force: true })

      if (response.status === 'success') {
        // Show success message
        Snackbar({
          message: `${actionMessages.success} ${instanceToDelete.gpu_name} successfully`,
          type: 'success'
        })

        // Refresh the instances list after a short delay
        setTimeout(() => {
          fetchGpuInstances()
        }, 1000)
      } else {
        // Show error message from the API
        Snackbar({
          message: response.message || `${actionMessages.error} ${instanceToDelete.gpu_name}`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error(`Error during delete:`, error)

      // Show error message
      const actionMessages = ACTION_MESSAGES['delete']
      Snackbar({
        message: error instanceof Error ? error.message : `${actionMessages.error} ${instanceToDelete.gpu_name}`,
        type: 'error'
      })
    } finally {
      // Unmark this instance as processing
      setProcessingInstances((prev) => ({ ...prev, [instanceToDelete.id]: false }))
      // Close the modal and reset the instance to delete
      setIsDeleteModalOpen(false)
      setInstanceToDelete(null)
    }
  }

  // Handle instance actions
  const handleInstanceAction = async (action: string, instance: GpuInstance) => {
    // Special handling for delete action
    if (action === 'delete') {
      // Open the confirmation modal instead of using window.confirm
      setInstanceToDelete(instance)
      setIsDeleteModalOpen(true)
      return
    }

    const apiAction = ACTION_MAP[action]
    if (!apiAction) {
      Snackbar({ message: `Unknown action: ${action}`, type: 'error' })
      return
    }

    try {
      // Mark this instance as processing
      setProcessingInstances((prev) => ({ ...prev, [instance.id]: true }))

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
          fetchGpuInstances()
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
      // Unmark this instance as processing
      setProcessingInstances((prev) => ({ ...prev, [instance.id]: false }))
    }
  }

  useEffect(() => {
    fetchGpuInstances(true)

    // Set up socket connection
    let cleanupFn: (() => void) | undefined

    setupSocket().then((cleanup) => {
      cleanupFn = cleanup
    })

    // Clean up the socket listeners when the component unmounts
    return () => {
      if (cleanupFn) {
        cleanupFn()
      }
    }
  }, [setupSocket])

  // Filter active instances for the Instances tab
  const activeInstances = gpuInstances
    .filter((instance) => !instance.is_deleted)
    .filter(
      (instance) =>
        searchTerm === '' ||
        instance.gpu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.flavor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.status.toLowerCase().includes(searchTerm.toLowerCase())
    )

  // Filter deleted instances for the History tab
  const deletedInstances = gpuInstances
    .filter((instance) => instance.is_deleted || instance.status === 'DELETED')
    .filter(
      (instance) =>
        searchTerm === '' ||
        instance.gpu_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.flavor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.status.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Instances</div>
            <div className={styles.subTitle}>Manage your active instance and review your instances history.</div>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4">
        <Flex width="100%">
          <Tabs.Root
            value={activeTab}
            defaultValue="top"
            className={styles.wrapper}
            onValueChange={(value) => handleTabChange(value as TabValue)}
          >
            <Tabs.List className={styles.tabList}>
              {tabListItems.map((tabListItem, i) => (
                <Tabs.Trigger key={i} value={tabListItem.value} className={styles.tabListItem}>
                  <Flex gap="1">
                    {tabListItem.icon}
                    {tabListItem.name}
                  </Flex>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="instances" className={styles.tabContent}>
              {isLoading ? (
                <Flex className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <div className={styles.loadingText}>Loading instances...</div>
                </Flex>
              ) : error ? (
                <Flex className={styles.errorContainer}>
                  <div className={styles.errorText}>{error}</div>
                  <Button className={styles.retryButton} onClick={() => fetchGpuInstances(true)}>
                    Retry
                  </Button>
                </Flex>
              ) : (
                <Flex p="4" mt="4" direction="column" gap="4" width="100%" className={styles.instanceCardWrapper}>
                  {/* Search and action buttons row */}
                  <Flex justify="between" align="center" width="100%">
                    <div className={styles.searchContainer}>
                      <input
                        type="text"
                        placeholder="Search for a virtual machine"
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </div>
                    <Flex gap="2" align="center">
                      <div className={styles.balanceContainer}>
                        <WalletIcon />
                        {balanceLoading ? (
                          <div className={styles.balanceSpinner}></div>
                        ) : (
                          <span className={styles.balanceAmount}>${balance.toFixed(2)}</span>
                        )}
                      </div>
                      <Button className={styles.refreshButton} onClick={() => fetchGpuInstances()}>
                        <RefreshIcon />
                        Refresh
                      </Button>
                      <Button className={styles.deployButton} onClick={() => router.push('/dashboard/create-cluster')}>
                        Deploy New Virtual Machine
                      </Button>
                    </Flex>
                  </Flex>

                  {activeInstances.length === 0 ? (
                    <Flex
                      p="8"
                      direction="column"
                      gap="10px"
                      justify="center"
                      width="100%"
                      align="center"
                      className={styles.emptyStateContainer}
                    >
                      <div className={styles.instanceTitle}>You have not created any virtual machine yet.</div>
                    </Flex>
                  ) : (
                    <div className={styles.tableContainer}>
                      {tableLoading && (
                        <div className={styles.tableLoadingOverlay}>
                          <div className={styles.loadingSpinner}></div>
                        </div>
                      )}
                      <Table.Root className={styles.historyTable}>
                        <Table.Header>
                          <Table.Row className={styles.historyTableHeader}>
                            {instancesTableHeaderItems.map((item) => (
                              <Table.ColumnHeaderCell key={item}>
                                <Flex align="center" gap="2" className={styles.historyTableCell}>
                                  {item}
                                </Flex>
                              </Table.ColumnHeaderCell>
                            ))}
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {activeInstances.map((instance) => (
                            <Table.Row key={instance.id}>
                              <Table.Cell className={styles.historyTableCell}>{instance.gpu_name}</Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>{instance.flavor_name}</Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>{instance.region}</Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                <span className={`${styles.statusBadge} ${getStatusColor(instance.status)}`}>
                                  {instance.status === 'BUILD' || instance.status === 'CREATING'
                                    ? 'CREATING'
                                    : instance.status}
                                </span>
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                {formatDate(instance.createdAt)}
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                <Link
                                  href="#"
                                  className={styles.consoleLink}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    navigateToConsole(instance)
                                  }}
                                >
                                  <Flex align="center" gap="1">
                                    Console <ExternalLink />
                                  </Flex>
                                </Link>
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                <FormSelect
                                  items={getActionItems(instance)}
                                  onChange={(value: string) => handleInstanceAction(value, instance)}
                                  className={styles.actionSelect}
                                  defaultValue="placeholder"
                                  disabled={processingInstances[instance.id]}
                                />
                                {processingInstances[instance.id] && (
                                  <div className={styles.processingIndicator}>
                                    <div className={styles.processingSpinner}></div>
                                  </div>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </div>
                  )}
                </Flex>
              )}
            </Tabs.Content>
            <Tabs.Content value="history" className={styles.tabContent}>
              {isLoading ? (
                <Flex className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <div className={styles.loadingText}>Loading history...</div>
                </Flex>
              ) : error ? (
                <Flex className={styles.errorContainer}>
                  <div className={styles.errorText}>{error}</div>
                  <Button className={styles.retryButton} onClick={() => fetchGpuInstances(true)}>
                    Retry
                  </Button>
                </Flex>
              ) : (
                <Flex p="4" mt="4" direction="column" gap="4" width="100%" className={styles.instanceCardWrapper}>
                  {/* Search and refresh row */}
                  <Flex justify="between" align="center" width="100%">
                    <div className={styles.searchContainer}>
                      <input
                        type="text"
                        placeholder="Search for a virtual machine"
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </div>
                    <Flex gap="2" align="center">
                      <div className={styles.balanceContainer}>
                        <WalletIcon />
                        {balanceLoading ? (
                          <div className={styles.balanceSpinner}></div>
                        ) : (
                          <span className={styles.balanceAmount}>${balance.toFixed(2)}</span>
                        )}
                      </div>
                      <Button className={styles.refreshButton} onClick={() => fetchGpuInstances()}>
                        <RefreshIcon />
                        Refresh
                      </Button>
                    </Flex>
                  </Flex>

                  {deletedInstances.length === 0 ? (
                    <Flex
                      p="8"
                      direction="column"
                      gap="10px"
                      justify="center"
                      width="100%"
                      align="center"
                      className={styles.emptyStateContainer}
                    >
                      <div className={styles.instanceTitle}>No Data</div>
                      <div className={styles.instanceContent}>You haven&apos;t terminated any instances yet.</div>
                    </Flex>
                  ) : (
                    <div className={styles.tableContainer}>
                      {tableLoading && (
                        <div className={styles.tableLoadingOverlay}>
                          <div className={styles.loadingSpinner}></div>
                        </div>
                      )}
                      <Table.Root className={styles.historyTable}>
                        <Table.Header>
                          <Table.Row className={styles.historyTableHeader}>
                            {historyTableHeaderItems.map((item) => (
                              <Table.ColumnHeaderCell key={item}>
                                <Flex align="center" gap="2" className={styles.historyTableCell}>
                                  {item}
                                </Flex>
                              </Table.ColumnHeaderCell>
                            ))}
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {deletedInstances.map((instance) => (
                            <Table.Row key={instance.id}>
                              <Table.Cell className={styles.historyTableCell}>{instance.gpu_name}</Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>{instance.flavor_name}</Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>{instance.region}</Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                <span className={`${styles.statusBadge} ${getStatusColor(instance.status)}`}>
                                  {instance.status}
                                </span>
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                {formatDate(instance.createdAt)}
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                {formatDate(instance.deleted_at)}
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                <Button
                                  className={styles.instanceButton}
                                  onClick={() => router.push('/dashboard/create-cluster')}
                                >
                                  Redeploy
                                </Button>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </div>
                  )}
                </Flex>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Flex>
      </Flex>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title className={styles.modalTitle}>Confirm Delete</Dialog.Title>
            <Dialog.Description className={styles.modalDescription}>
              Are you sure you want to delete {instanceToDelete?.gpu_name}? This action cannot be undone.
            </Dialog.Description>

            <Flex justify="end" gap="3" mt="4">
              <Button
                className={styles.cancelButton}
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setInstanceToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button className={styles.deleteButton} onClick={handleConfirmDelete}>
                Delete
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default Instances
