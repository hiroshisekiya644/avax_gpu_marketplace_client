'use client'
import { useState, useEffect } from 'react'
import type React from 'react'

import * as Tabs from '@radix-ui/react-tabs'
import { Flex, Button, Table, Link } from '@radix-ui/themes'
import { useRouter } from 'next/navigation'
import { getGpuAction, manageVM } from '@/api/GpuProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'
import { FormSelect, type SelectItem } from '@/components/select/FormSelect'

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
interface GpuResponse {
  status: string
  gpu: GpuInstance[]
}

const GpuIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="gpu-icon" />
const HistoryIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="history-icon" />
const RefreshIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="refresh-icon" />
const ExternalLink = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="external-link" />

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
        return styles.statusPending
      case 'ERROR':
        return styles.statusError
      default:
        return styles.statusDefault
    }
  }

  // Render feature badges for the instance
  const renderFeatureBadges = (features: FlavorFeatures) => {
    const badges = []

    if (features.no_hibernation) {
      badges.push(
        <span key="no-hibernation" className={styles.restrictionBadge}>
          No Hibernation
        </span>
      )
    }

    if (features.local_storage_only) {
      badges.push(
        <span key="local-storage" className={styles.restrictionBadge}>
          Local Storage Only
        </span>
      )
    }

    return badges.length > 0 ? (
      <Flex gap="1" wrap="wrap">
        {badges}
      </Flex>
    ) : (
      <span className={styles.noFeatures}>None</span>
    )
  }

  // Then update the fetchGpuInstances function to handle the array properly
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

        // Sort instances by creation date (newest first)
        const sortedInstances = [...gpuData].sort(
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

  // Get console URL for an instance
  const getConsoleUrl = (instance: GpuInstance) => {
    // This is a placeholder - replace with actual console URL logic
    return `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/gpus/vm/console/${instance.instance_id}`
  }

  // Get action items for an instance
  const getActionItems = (instance: GpuInstance): SelectItem[] => {
    // Check if the instance is being processed
    const isProcessing = processingInstances[instance.id] === true

    // Base items with disabled state based on processing status
    const items: SelectItem[] = [
      { label: 'Actions', name: 'placeholder', disabled: true },
      { label: 'Start', name: 'start', disabled: isProcessing || instance.status.toUpperCase() === 'ACTIVE' },
      {
        label: 'Hard Reboot',
        name: 'hard-reboot',
        disabled: isProcessing || instance.status.toUpperCase() !== 'ACTIVE'
      }
    ]

    // Always add hibernate option, but disable it if no_hibernation is true or instance is not active
    items.push({
      label: 'Hibernate',
      name: 'hibernate',
      disabled:
        isProcessing || instance.flavor_features?.no_hibernation === true || instance.status.toUpperCase() !== 'ACTIVE'
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
    'hard-reboot': 'hard-reboot',
    hibernate: 'hibernate',
    delete: 'delete'
  }

  // Map action names to user-friendly messages
  const ACTION_MESSAGES: Record<string, { pending: string; success: string; error: string }> = {
    start: {
      pending: 'Starting',
      success: 'Started',
      error: 'Failed to start'
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

  // Handle instance actions
  const handleInstanceAction = async (action: string, instance: GpuInstance) => {
    const apiAction = ACTION_MAP[action]
    if (!apiAction) {
      Snackbar({ message: `Unknown action: ${action}`, type: 'error' })
      return
    }

    // For delete action, show confirmation dialog
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${instance.gpu_name}?`)) {
        return
      }
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
        instanceId: instance.instance_id,
        // Add force parameter for certain actions if needed
        ...(action === 'delete' ? { force: true } : {})
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

    // Set up polling to refresh the instances list every 30 seconds
    const intervalId = setInterval(() => {
      fetchGpuInstances()
    }, 30000)

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId)
  }, [])

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
                    <Flex gap="2">
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
                                  {instance.status}
                                </span>
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                {formatDate(instance.createdAt)}
                              </Table.Cell>
                              <Table.Cell className={styles.historyTableCell}>
                                <Link
                                  href={getConsoleUrl(instance)}
                                  target="_blank"
                                  className={styles.consoleLink}
                                  onClick={(e) => {
                                    // Prevent navigation if instance is not active
                                    if (instance.status.toUpperCase() !== 'ACTIVE') {
                                      e.preventDefault()
                                      Snackbar({
                                        message: 'Console is only available for active instances',
                                        type: 'info'
                                      })
                                    }
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
                    <Button className={styles.refreshButton} onClick={() => fetchGpuInstances()}>
                      <RefreshIcon />
                      Refresh
                    </Button>
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
    </Flex>
  )
}

export default Instances
