'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Flex, Theme } from '@radix-ui/themes'
import Link from 'next/link'
import { getUserKeyPairs, importKeyPair, deleteKeyPair, type KeyPair, updateKeyPair } from '@/api/KeyPair'
import { getRegionAction } from '@/api/RegionProvider'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormSelect, type SelectItem } from '@/components/select/FormSelect'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from '../page.module.css'

// First, let's update the Region interface to make the fields optional that might not be present in the API response
interface Region {
  id: number | string
  name: string
  country?: string | null
  description?: string | null
  green_status?: string
}

// Icons
const ProfileIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="profile-icon" />
const KeyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="key-icon" />
const EditIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="edit-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="delete-icon" />
const CopyIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="copy-icon" />
const GreenIcon = () => <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" title="Green Energy" />
const DialogCheck = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="check-icon" />

const SSHKeysPage = () => {
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sshKeys, setSSHKeys] = useState<KeyPair[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [regionItems, setRegionItems] = useState<SelectItem[]>([])
  const [isLoadingRegions, setIsLoadingRegions] = useState(false)

  // Form states
  const [newKeyData, setNewKeyData] = useState({
    ssh_key_name: '',
    ssh_public_key: '',
    region: ''
  })

  // Add a new state for edit modal and the key being edited
  const [isEditKeyModalOpen, setIsEditKeyModalOpen] = useState(false)
  const [keyToEdit, setKeyToEdit] = useState<KeyPair | null>(null)
  const [newKeyName, setNewKeyName] = useState('')

  // Add a new state to track which key's content has been copied
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null)

  // Fetch SSH keys and regions on component mount
  useEffect(() => {
    fetchSSHKeys()
    fetchRegions()
  }, [])

  // Set default region when regions are loaded
  useEffect(() => {
    if (regionItems.length > 0 && !newKeyData.region) {
      setNewKeyData((prev) => ({
        ...prev,
        region: String(regionItems[0].name)
      }))
    }
  }, [regionItems, newKeyData.region])

  // Convert regions to SelectItem format for FormSelect
  useEffect(() => {
    if (regions.length > 0) {
      const items: SelectItem[] = regions.map((region) => {
        const isGreen = isGreenEnergy(region)
        return {
          label: `${region.name}${isGreen ? ' (Green Energy)' : ''}`,
          name: region.name,
          image: isGreen ? <GreenIcon /> : undefined
        }
      })
      setRegionItems(items)
    }
  }, [regions])

  // Add this useEffect to ensure proper z-index for dropdown content
  useEffect(() => {
    // Add a style to ensure the Select dropdown appears above other elements
    const style = document.createElement('style')
    style.innerHTML = `
      [data-radix-popper-content-wrapper] {
        z-index: 9999 !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const fetchRegions = async () => {
    try {
      setIsLoadingRegions(true)
      const response = await getRegionAction()
      console.log('Regions response:', response)
      if (response.data && response.data.regions) {
        setRegions(response.data.regions)
      } else {
        console.error('Unexpected region response format:', response)
        Snackbar({ message: 'Failed to parse regions data', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to fetch regions:', error)
      Snackbar({ message: 'Failed to fetch regions', type: 'error' })
    } finally {
      setIsLoadingRegions(false)
    }
  }

  const fetchSSHKeys = async () => {
    try {
      setIsLoading(true)
      const response = await getUserKeyPairs()
      setSSHKeys(response.keyPairs)
    } catch (error) {
      console.error('Failed to fetch SSH keys:', error)
      Snackbar({ message: 'Failed to fetch SSH keys', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewKeyDataChange = (field: string, value: string) => {
    setNewKeyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegionChange = (value: string) => {
    handleNewKeyDataChange('region', value)
  }

  const handleAddKey = async () => {
    try {
      setIsLoading(true)
      await importKeyPair(newKeyData)
      Snackbar({ message: 'SSH key added successfully' })
      setIsAddKeyModalOpen(false)
      setNewKeyData({
        ssh_key_name: '',
        ssh_public_key: '',
        region: regionItems.length > 0 ? String(regionItems[0].name) : ''
      })
      await fetchSSHKeys()
    } catch (error) {
      console.error('Failed to add SSH key:', error)
      Snackbar({ message: 'Failed to add SSH key', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKey = async () => {
    if (keyToDelete === null) return

    try {
      setIsLoading(true)
      await deleteKeyPair(keyToDelete)
      Snackbar({ message: 'SSH key deleted successfully' })
      setIsDeleteModalOpen(false)
      setKeyToDelete(null)
      await fetchSSHKeys()
    } catch (error) {
      console.error('Failed to delete SSH key:', error)
      Snackbar({ message: 'Failed to delete SSH key', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to handle editing a key
  const handleEditKey = async () => {
    if (keyToEdit === null) return

    try {
      setIsLoading(true)
      await updateKeyPair(keyToEdit.id, { name: newKeyName })
      Snackbar({ message: 'SSH key updated successfully' })
      setIsEditKeyModalOpen(false)
      setKeyToEdit(null)
      setNewKeyName('')
      await fetchSSHKeys()
    } catch (error) {
      console.error('Failed to update SSH key:', error)
      Snackbar({ message: 'Failed to update SSH key', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the copyToClipboard function to set the copied key ID
  const copyToClipboard = async (text: string, keyId: number) => {
    try {
      // Check if we're in a browser environment and if the clipboard API is available
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        Snackbar({ message: 'Copied to clipboard' })
        setCopiedKeyId(keyId)

        // Reset the copied key ID after 2 seconds
        setTimeout(() => {
          setCopiedKeyId(null)
        }, 2000)
      } else {
        // Fallback method using a temporary textarea element
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (successful) {
          Snackbar({ message: 'Copied to clipboard' })
          setCopiedKeyId(keyId)

          // Reset the copied key ID after 2 seconds
          setTimeout(() => {
            setCopiedKeyId(null)
          }, 2000)
        } else {
          Snackbar({ message: 'Failed to copy to clipboard', type: 'error' })
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      Snackbar({ message: 'Failed to copy to clipboard', type: 'error' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Then, let's update the isGreenEnergy function to safely check for the green_status property
  const isGreenEnergy = (region?: Region): boolean => {
    return !!region && region.green_status === 'GREEN'
  }

  // Find region details by name
  const getRegionDetails = (regionName: string): Region | undefined => {
    return regions.find((region) => region.name === regionName)
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>SSH Keys</div>
            <div className={styles.subTitle}>Manage SSH keys for secure access to GPU instances</div>
          </Flex>
        </Flex>
      </Flex>

      <Flex p="4">
        <div className={styles.wrapper}>
          {/* Navigation Tabs */}
          <div className={styles.tabList}>
            <Link href="/dashboard/profile/account" className={styles.tabListItem}>
              <Flex gap="1">
                <ProfileIcon />
                Account
              </Flex>
            </Link>
            <Link href="/dashboard/profile/ssh-keys" className={`${styles.tabListItem} ${styles.activeTab}`}>
              <Flex gap="1">
                <KeyIcon />
                SSH Keys
              </Flex>
            </Link>
          </div>

          {/* SSH Keys Content */}
          <div className={styles.tabContent}>
            {isLoading ? (
              <div className={styles.skeletonContainer}>
                <div className={styles.skeletonCard} style={{ height: '300px' }}></div>
              </div>
            ) : (
              <Flex direction="column" mt="4">
                <div className={styles.card}>
                  <Flex justify="between" align="center" mb="4">
                    <div>
                      <h2 className={styles.cardTitle}>SSH Keys</h2>
                      <p className={styles.cardDescription}>Manage SSH keys to securely access your GPU instances</p>
                    </div>
                    <button className={styles.button} onClick={() => setIsAddKeyModalOpen(true)}>
                      Add SSH Key
                    </button>
                  </Flex>

                  {!isLoading && sshKeys.length === 0 && (
                    <p className={styles.cardDescription}>
                      You don&apos;t have any SSH keys yet. Add one to get started.
                    </p>
                  )}

                  <div className={styles.sshKeyList}>
                    {sshKeys.map((key) => (
                      <div key={key.id} className={styles.sshKeyItem}>
                        <div className={styles.sshKeyName}>{key.ssh_key_name}</div>

                        {/* Update the button in the SSH key list to pass the key ID and show the appropriate icon */}
                        <div className={styles.sshKeyFingerprint}>
                          {key.ssh_public_key.length > 60
                            ? `${key.ssh_public_key.substring(0, 60)}...`
                            : key.ssh_public_key}
                          <button
                            onClick={() => copyToClipboard(key.ssh_public_key, key.id)}
                            style={{ marginLeft: '8px', cursor: 'pointer' }}
                          >
                            {copiedKeyId === key.id ? <DialogCheck /> : <CopyIcon />}
                          </button>
                        </div>

                        <div className={styles.sshKeyMeta}>
                          <span>
                            Added on {formatDate(key.createdAt)} • Region: {key.region}
                            {isGreenEnergy(getRegionDetails(key.region)) && <GreenIcon />}
                          </span>
                          <div className={styles.sshKeyActions}>
                            <button
                              className={styles.buttonSecondary}
                              onClick={() => {
                                setKeyToEdit(key)
                                setNewKeyName(key.ssh_key_name)
                                setIsEditKeyModalOpen(true)
                              }}
                            >
                              <EditIcon />
                            </button>
                            <button
                              className={styles.buttonDanger}
                              onClick={() => {
                                setKeyToDelete(key.id)
                                setIsDeleteModalOpen(true)
                              }}
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Flex>
            )}
          </div>
        </div>
      </Flex>

      {/* Add SSH Key Modal */}
      <Dialog.Root open={isAddKeyModalOpen} onOpenChange={setIsAddKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Add SSH Key</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Add a new SSH key to securely access your GPU instances
              </Dialog.Description>

              <div>
                <label className={`${styles.formLabel} ${styles.requiredField}`}>Key Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., My Work Laptop"
                  value={newKeyData.ssh_key_name}
                  onChange={(e) => handleNewKeyDataChange('ssh_key_name', e.target.value)}
                />
              </div>

              <div>
                {isLoadingRegions ? (
                  <div className={styles.loadingRegions}>
                    <div className={styles.loadingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div>Loading regions...</div>
                  </div>
                ) : (
                  <FormSelect
                    id="region"
                    name="region"
                    items={regionItems}
                    label="Region"
                    required
                    value={newKeyData.region}
                    onChange={handleRegionChange}
                    className={styles.selectBox}
                  />
                )}
              </div>

              <div>
                <label className={`${styles.formLabel} ${styles.requiredField}`}>Public Key</label>
                <textarea
                  className={styles.formInput}
                  rows={4}
                  placeholder="Paste your SSH public key here (begins with ssh-rsa or ssh-ed25519)"
                  value={newKeyData.ssh_public_key}
                  onChange={(e) => handleNewKeyDataChange('ssh_public_key', e.target.value)}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setIsAddKeyModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className={styles.button}
                  onClick={handleAddKey}
                  disabled={isLoading || !newKeyData.ssh_key_name || !newKeyData.ssh_public_key || !newKeyData.region}
                >
                  {isLoading ? 'Adding...' : 'Add Key'}
                </button>
              </div>

              <Dialog.Close asChild>
                <button className={styles.closeButton} aria-label="Close">
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Theme>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete SSH Key Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Delete SSH Key</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Are you sure you want to delete this SSH key? This action cannot be undone.
              </Dialog.Description>

              <div className={styles.modalFooter}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button className={styles.buttonDanger} onClick={handleDeleteKey} disabled={isLoading}>
                  {isLoading ? 'Deleting...' : 'Delete Key'}
                </button>
              </div>

              <Dialog.Close asChild>
                <button className={styles.closeButton} aria-label="Close">
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Theme>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit SSH Key Modal */}
      <Dialog.Root open={isEditKeyModalOpen} onOpenChange={setIsEditKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Edit SSH Key</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Update the name of your SSH key
              </Dialog.Description>

              <div>
                <label className={`${styles.formLabel} ${styles.requiredField}`}>Key Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., My Work Laptop"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              {keyToEdit && (
                <div>
                  <label className={styles.formLabel}>Region</label>
                  <div className={styles.formInput}>
                    {keyToEdit.region}
                    {isGreenEnergy(getRegionDetails(keyToEdit.region)) && <GreenIcon />}
                  </div>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setIsEditKeyModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button className={styles.button} onClick={handleEditKey} disabled={isLoading || !newKeyName.trim()}>
                  {isLoading ? 'Updating...' : 'Update Key'}
                </button>
              </div>

              <Dialog.Close asChild>
                <button className={styles.closeButton} aria-label="Close">
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Theme>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default SSHKeysPage
