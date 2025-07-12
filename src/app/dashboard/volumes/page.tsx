'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '@/components/card/Card'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { getVolumes, type Volume } from '@/api/VolumeProvider'
import styles from './page.module.css'

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [volumeToDelete, setVolumeToDelete] = useState<Volume | null>(null)

  // Fetch volumes from backend
  const fetchVolumes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getVolumes()

      if (response.status === 'success' && response.volumes) {
        setVolumes(response.volumes)
      } else {
        setVolumes([])
        if (response.message) {
          setError(response.message)
        }
      }
    } catch (err) {
      console.error('Error fetching volumes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch volumes')
      setVolumes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVolumes()
  }, [])

  const filteredVolumes = volumes.filter((volume) => {
    const matchesSearch =
      volume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volume.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      volume.hyperstack_volume_id.toString().toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedTab === 'all') return matchesSearch
    if (selectedTab === 'attached') return matchesSearch && (volume.status === 'attached' || volume.status === 'in-use')
    if (selectedTab === 'available') return matchesSearch && volume.status === 'available'

    return matchesSearch
  })

  const getStatusBadge = (status: Volume['status']) => {
    const statusConfig = {
      available: { className: styles.statusAvailable, text: 'Available' },
      attached: { className: styles.statusAttached, text: 'Attached' },
      'in-use': { className: styles.statusAttached, text: 'In Use' },
      creating: { className: styles.statusCreating, text: 'Creating' },
      deleting: { className: styles.statusCreating, text: 'Deleting' },
      error: { className: styles.statusError, text: 'Error' }
    }

    const config = statusConfig[status] || { className: styles.statusError, text: status }

    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {(status === 'creating' || status === 'deleting') && <span className={styles.statusSpinner}></span>}
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
      // For now, just remove from local state
      // TODO: Implement actual delete API call
      setVolumes(volumes.filter((v) => v.id !== volumeToDelete.id))
      setDeleteDialogOpen(false)
      setVolumeToDelete(null)
    }
  }

  const handleRefresh = () => {
    fetchVolumes()
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

  // Helper function to get display type
  const getDisplayType = (type: string) => {
    if (type.includes('SSD')) return 'SSD'
    if (type.includes('HDD')) return 'HDD'
    return type
  }

  const totalVolumes = volumes.length
  const totalStorage = volumes.reduce((sum, vol) => sum + vol.size, 0)
  const attachedCount = volumes.filter((v) => v.status === 'attached' || v.status === 'in-use').length
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
            <button className={styles.refreshButton} onClick={handleRefresh} disabled={loading}>
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
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <DynamicSvgIcon iconName="alert-circle" width={16} height={16} className="text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

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
                        <th className={styles.volumeTableCell}>Bootable</th>
                        <th className={styles.volumeTableCell}>Created</th>
                        <th className={styles.volumeTableCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolumes.map((volume) => (
                        <tr key={volume.id}>
                          <td className={styles.volumeTableCell}>
                            <div>
                              <div className="font-medium text-white">{volume.name}</div>
                              <div className="text-sm text-gray-400">ID: {volume.id}</div>
                              <div className="text-xs text-gray-500">Hyperstack: {volume.hyperstack_volume_id}</div>
                            </div>
                          </td>
                          <td className={styles.volumeTableCell}>{formatSize(volume.size)}</td>
                          <td className={styles.volumeTableCell}>
                            <span className="text-sm">{getDisplayType(volume.type)}</span>
                            <div className="text-xs text-gray-400">{volume.type}</div>
                          </td>
                          <td className={styles.volumeTableCell}>{getStatusBadge(volume.status)}</td>
                          <td className={styles.volumeTableCell}>{volume.region}</td>
                          <td className={styles.volumeTableCell}>
                            {volume.bootable ? (
                              <span className="inline-flex items-center gap-1 text-green-400">
                                <DynamicSvgIcon iconName="check-circle" width={12} height={12} />
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </td>
                          <td className={styles.volumeTableCell}>{formatDate(volume.createdAt)}</td>
                          <td className={styles.volumeTableCell}>
                            <div className="flex items-center gap-2">
                              <button className={styles.actionButton} title="Edit">
                                <DynamicSvgIcon iconName="edit-icon" width={14} height={14} />
                              </button>
                              <button
                                className={styles.actionButton}
                                title={volume.status === 'attached' || volume.status === 'in-use' ? 'Detach' : 'Attach'}
                              >
                                <DynamicSvgIcon
                                  iconName={
                                    volume.status === 'attached' || volume.status === 'in-use'
                                      ? 'detach-icon'
                                      : 'attach-icon'
                                  }
                                  width={14}
                                  height={14}
                                />
                              </button>
                              <button
                                className={styles.actionButtonDelete}
                                title="Delete"
                                onClick={() => handleDeleteVolume(volume)}
                                disabled={volume.status === 'deleting'}
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
