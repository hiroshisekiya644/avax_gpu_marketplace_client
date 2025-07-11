'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '@/components/card/Card'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import styles from './page.module.css'

interface Volume {
  id: string
  name: string
  size: number
  type: 'SSD' | 'HDD'
  status: 'available' | 'attached' | 'creating' | 'error'
  region: string
  createdAt: string
  attachedTo?: string
  attachedInstanceName?: string
}

const mockVolumes: Volume[] = [
  {
    id: 'vol-1a2b3c4d',
    name: 'ml-dataset-storage',
    size: 500,
    type: 'SSD',
    status: 'attached',
    region: 'us-west-2',
    createdAt: '2024-01-15T10:30:00Z',
    attachedTo: 'i-1234567890abcdef0',
    attachedInstanceName: 'gpu-training-01'
  },
  {
    id: 'vol-2e3f4g5h',
    name: 'backup-volume',
    size: 1000,
    type: 'HDD',
    status: 'available',
    region: 'us-east-1',
    createdAt: '2024-01-10T14:20:00Z'
  },
  {
    id: 'vol-3i4j5k6l',
    name: 'model-checkpoints',
    size: 250,
    type: 'SSD',
    status: 'creating',
    region: 'eu-west-1',
    createdAt: '2024-01-20T09:15:00Z'
  },
  {
    id: 'vol-4m5n6o7p',
    name: 'data-processing',
    size: 750,
    type: 'SSD',
    status: 'error',
    region: 'us-west-2',
    createdAt: '2024-01-18T16:45:00Z'
  }
]

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [volumeToDelete, setVolumeToDelete] = useState<Volume | null>(null)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setVolumes(mockVolumes)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filteredVolumes = volumes.filter((volume) => {
    const matchesSearch =
      volume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volume.id.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedTab === 'all') return matchesSearch
    if (selectedTab === 'attached') return matchesSearch && volume.status === 'attached'
    if (selectedTab === 'available') return matchesSearch && volume.status === 'available'

    return matchesSearch
  })

  const getStatusBadge = (status: Volume['status']) => {
    const statusConfig = {
      available: { className: styles.statusAvailable, text: 'Available' },
      attached: { className: styles.statusAttached, text: 'Attached' },
      creating: { className: styles.statusCreating, text: 'Creating' },
      error: { className: styles.statusError, text: 'Error' }
    }

    const config = statusConfig[status]

    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {status === 'creating' && <span className={styles.statusSpinner}></span>}
        {config.text}
      </span>
    )
  }

  const handleDeleteVolume = (volume: Volume) => {
    setVolumeToDelete(volume)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (volumeToDelete) {
      setVolumes(volumes.filter((v) => v.id !== volumeToDelete.id))
      setDeleteDialogOpen(false)
      setVolumeToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSize = (sizeGB: number) => {
    if (sizeGB >= 1000) {
      return `${(sizeGB / 1000).toFixed(1)} TB`
    }
    return `${sizeGB} GB`
  }

  const totalVolumes = volumes.length
  const totalStorage = volumes.reduce((sum, vol) => sum + vol.size, 0)
  const attachedCount = volumes.filter((v) => v.status === 'attached').length
  const availableCount = volumes.filter((v) => v.status === 'available').length

  if (loading) {
    return (
      <div className={styles.bg}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading volumes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bg}>
      {/* Header */}
      <div className={styles.header}>
        <div className="flex items-center justify-between px-6">
          <div>
            <h1 className={styles.headerTitle}>Volumes</h1>
            <p className={styles.subTitle}>Manage your storage volumes</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={styles.balanceContainer}>
              <DynamicSvgIcon iconName="wallet-icon" width={16} height={16} />
              <span className={styles.balanceAmount}>$125.50</span>
            </div>
            <button className={styles.refreshButton}>
              <DynamicSvgIcon iconName="refresh-icon" width={16} height={16} />
              <span>Refresh</span>
            </button>
            <button className={styles.createButton}>
              <DynamicSvgIcon iconName="pluscircle-icon" width={16} height={16} />
              <span>Create Volume</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={styles.volumeCardWrapper}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={styles.volumeContent}>Total Volumes</p>
                  <p className={styles.volumeTitle}>{totalVolumes}</p>
                </div>
                <DynamicSvgIcon iconName="disk" width={24} height={24} className="text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className={styles.volumeCardWrapper}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={styles.volumeContent}>Total Storage</p>
                  <p className={styles.volumeTitle}>{formatSize(totalStorage)}</p>
                </div>
                <DynamicSvgIcon iconName="server-icon" width={24} height={24} className="text-green-500" />
              </div>
            </div>
          </Card>

          <Card className={styles.volumeCardWrapper}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={styles.volumeContent}>Attached</p>
                  <p className={styles.volumeTitle}>{attachedCount}</p>
                </div>
                <DynamicSvgIcon iconName="attach-icon" width={24} height={24} className="text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className={styles.volumeCardWrapper}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={styles.volumeContent}>Available</p>
                  <p className={styles.volumeTitle}>{availableCount}</p>
                </div>
                <DynamicSvgIcon iconName="check-circle" width={24} height={24} className="text-green-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs and Search */}
        <Tabs.Root value={selectedTab} onValueChange={setSelectedTab} className={styles.wrapper}>
          <div className="flex items-center justify-between mb-6">
            <Tabs.List className={styles.tabList}>
              <Tabs.Trigger value="all" className={styles.tabListItem}>
                <DynamicSvgIcon iconName="show-all" width={16} height={16} />
                <span>All Volumes</span>
              </Tabs.Trigger>
              <Tabs.Trigger value="attached" className={styles.tabListItem}>
                <DynamicSvgIcon iconName="attach-icon" width={16} height={16} />
                <span>Attached</span>
              </Tabs.Trigger>
              <Tabs.Trigger value="available" className={styles.tabListItem}>
                <DynamicSvgIcon iconName="show-available" width={16} height={16} />
                <span>Available</span>
              </Tabs.Trigger>
            </Tabs.List>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search volumes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <Tabs.Content value={selectedTab} className={styles.tabContent}>
            {filteredVolumes.length === 0 ? (
              <div className={styles.emptyStateContainer}>
                <Card className={styles.volumeCardWrapper}>
                  <div className="p-12 text-center">
                    <DynamicSvgIcon iconName="disk" width={48} height={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className={styles.volumeTitle}>No volumes found</h3>
                    <p className={styles.volumeContent}>
                      {searchTerm
                        ? 'No volumes match your search criteria.'
                        : 'Create your first volume to get started.'}
                    </p>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className={styles.volumeCardWrapper}>
                <div className={styles.tableContainer}>
                  <table className={styles.volumeTable}>
                    <thead className={styles.volumeTableHeader}>
                      <tr>
                        <th className={styles.volumeTableCell}>Name</th>
                        <th className={styles.volumeTableCell}>Size</th>
                        <th className={styles.volumeTableCell}>Type</th>
                        <th className={styles.volumeTableCell}>Status</th>
                        <th className={styles.volumeTableCell}>Region</th>
                        <th className={styles.volumeTableCell}>Created</th>
                        <th className={styles.volumeTableCell}>Attached To</th>
                        <th className={styles.volumeTableCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolumes.map((volume) => (
                        <tr key={volume.id}>
                          <td className={styles.volumeTableCell}>
                            <div>
                              <div className="font-medium text-white">{volume.name}</div>
                              <div className="text-sm text-gray-400">{volume.id}</div>
                            </div>
                          </td>
                          <td className={styles.volumeTableCell}>{formatSize(volume.size)}</td>
                          <td className={styles.volumeTableCell}>{volume.type}</td>
                          <td className={styles.volumeTableCell}>{getStatusBadge(volume.status)}</td>
                          <td className={styles.volumeTableCell}>{volume.region}</td>
                          <td className={styles.volumeTableCell}>{formatDate(volume.createdAt)}</td>
                          <td className={styles.volumeTableCell}>
                            {volume.attachedTo ? (
                              <a href={`/dashboard/instances/${volume.attachedTo}`} className={styles.volumeNameLink}>
                                {volume.attachedInstanceName || volume.attachedTo}
                                <DynamicSvgIcon iconName="external-link" width={12} height={12} />
                              </a>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className={styles.volumeTableCell}>
                            <div className="flex items-center gap-2">
                              <button className={styles.actionButton} title="Edit">
                                <DynamicSvgIcon iconName="edit-icon" width={14} height={14} />
                              </button>
                              <button
                                className={styles.actionButton}
                                title={volume.status === 'attached' ? 'Detach' : 'Attach'}
                              >
                                <DynamicSvgIcon
                                  iconName={volume.status === 'attached' ? 'detach-icon' : 'attach-icon'}
                                  width={14}
                                  height={14}
                                />
                              </button>
                              <button
                                className={styles.actionButtonDelete}
                                title="Delete"
                                onClick={() => handleDeleteVolume(volume)}
                              >
                                <DynamicSvgIcon iconName="delete-icon" width={14} height={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title className={styles.modalTitle}>Delete Volume</Dialog.Title>
            <Dialog.Description className={styles.modalDescription}>
              {'Are you sure you want to delete the volume "'}
              {volumeToDelete?.name}
              {'?" This action cannot be undone.'}
            </Dialog.Description>
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button className={styles.cancelButton}>Cancel</button>
              </Dialog.Close>
              <button className={styles.deleteButton} onClick={confirmDelete}>
                Delete Volume
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
