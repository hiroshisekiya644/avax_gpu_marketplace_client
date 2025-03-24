'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'
import * as Tabs from '@radix-ui/react-tabs'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import { getUserKeyPairs, importKeyPair, deleteKeyPair, type KeyPair, updateKeyPair } from '@/api/KeyPair'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'
import type { SelectItem } from '@/components/select/FormSelect'

// Icons
const ProfileIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="profile-icon" />
const KeyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="key-icon" />
const EditIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="edit-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="delete-icon" />
const CopyIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="copy-icon" />

type TabValue = 'profile' | 'ssh-keys'
const tabValues: TabValue[] = ['profile', 'ssh-keys']
const tabListItems = [
  { name: 'Profile', icon: <ProfileIcon />, value: 'profile' },
  { name: 'SSH Keys', icon: <KeyIcon />, value: 'ssh-keys' }
]

// Mock user data - replace with actual API call in production
const mockUserData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  company: 'AVAX GPU',
  location: 'San Francisco, CA',
  bio: 'GPU enthusiast and cloud computing professional',
  avatarUrl: '/icons/avatar.png'
}

// Region options for SSH key
const regionOptions: SelectItem[] = [
  { label: 'US East', name: 'us-east' },
  { label: 'US West', name: 'us-west' },
  { label: 'EU Central', name: 'eu-central' },
  { label: 'Asia Pacific', name: 'ap-southeast' },
  { label: 'Canada', name: 'canada' }
]

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<TabValue>(tabValues[0])
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sshKeys, setSSHKeys] = useState<KeyPair[]>([])

  // Form states
  const [userData, setUserData] = useState(mockUserData)
  const [newKeyData, setNewKeyData] = useState({
    ssh_key_name: '',
    ssh_public_key: '',
    region: 'us-east'
  })

  // Add a new state for edit modal and the key being edited
  const [isEditKeyModalOpen, setIsEditKeyModalOpen] = useState(false)
  const [keyToEdit, setKeyToEdit] = useState<KeyPair | null>(null)
  const [newKeyName, setNewKeyName] = useState('')

  // Fetch SSH keys on component mount
  useEffect(() => {
    fetchSSHKeys()
  }, [])

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

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value)
  }

  const handleUserDataChange = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNewKeyDataChange = (field: string, value: string) => {
    setNewKeyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = () => {
    // In a real app, you would call an API to update the user profile
    Snackbar({ message: 'Profile updated successfully' })
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
        region: 'us-east'
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      Snackbar({ message: 'Copied to clipboard' })
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Profile and SSH Keys</div>
            <div className={styles.subTitle}>
              Manage your profile information and SSH keys for secure access to GPU instances
            </div>
          </Flex>
        </Flex>
      </Flex>

      <Flex p="4">
        <Tabs.Root
          value={activeTab}
          defaultValue="profile"
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

          {/* Profile Tab */}
          <Tabs.Content value="profile" className={styles.tabContent}>
            <Flex direction="column" mt="4">
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Personal Information</h2>
                <p className={styles.cardDescription}>
                  Update your personal information and how others see you on the platform
                </p>

                <div className={styles.avatarSection}>
                  <div className={styles.avatar}>
                    {userData.avatarUrl ? (
                      <Image
                        src={userData.avatarUrl || '/placeholder.svg'}
                        alt="Profile"
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      userData.name.charAt(0)
                    )}
                  </div>
                  <div className={styles.avatarUpload}>
                    <button className={styles.avatarUploadButton}>Upload new image</button>
                    <p className={styles.avatarUploadHint}>JPG, PNG or GIF. 1MB max.</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={userData.name}
                    onChange={(e) => handleUserDataChange('name', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={userData.email}
                    onChange={(e) => handleUserDataChange('email', e.target.value)}
                    disabled
                  />
                  <p className={styles.avatarUploadHint}>Your email address is used for login and cannot be changed</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={userData.company}
                    onChange={(e) => handleUserDataChange('company', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={userData.location}
                    onChange={(e) => handleUserDataChange('location', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bio</label>
                  <textarea
                    className={styles.formInput}
                    rows={4}
                    value={userData.bio}
                    onChange={(e) => handleUserDataChange('bio', e.target.value)}
                  />
                </div>

                <Flex justify="end" gap="2">
                  <button className={styles.buttonSecondary}>Cancel</button>
                  <button className={styles.button} onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </Flex>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Account Security</h2>
                <p className={styles.cardDescription}>Manage your password and account security settings</p>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Current Password</label>
                  <input type="password" className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>New Password</label>
                  <input type="password" className={styles.formInput} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm New Password</label>
                  <input type="password" className={styles.formInput} />
                </div>

                <Flex justify="end">
                  <button className={styles.button}>Update Password</button>
                </Flex>
              </div>
            </Flex>
          </Tabs.Content>

          {/* SSH Keys Tab */}
          <Tabs.Content value="ssh-keys" className={styles.tabContent}>
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

                {isLoading && <p>Loading SSH keys...</p>}

                {!isLoading && sshKeys.length === 0 && (
                  <p className={styles.cardDescription}>
                    You don&apos;t have any SSH keys yet. Add one to get started.
                  </p>
                )}

                <div className={styles.sshKeyList}>
                  {sshKeys.map((key) => (
                    <div key={key.id} className={styles.sshKeyItem}>
                      <div className={styles.sshKeyName}>{key.ssh_key_name}</div>

                      <div className={styles.sshKeyFingerprint}>
                        {key.ssh_public_key.length > 60
                          ? `${key.ssh_public_key.substring(0, 60)}...`
                          : key.ssh_public_key}
                        <button
                          onClick={() => copyToClipboard(key.ssh_public_key)}
                          style={{ marginLeft: '8px', cursor: 'pointer' }}
                        >
                          <CopyIcon />
                        </button>
                      </div>

                      <div className={styles.sshKeyMeta}>
                        <span>
                          Added on {formatDate(key.createdAt)} • Region: {key.region}
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
          </Tabs.Content>
        </Tabs.Root>
      </Flex>

      {/* Add SSH Key Modal */}
      <Dialog.Root open={isAddKeyModalOpen} onOpenChange={setIsAddKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
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
              <label className={`${styles.formLabel} ${styles.requiredField}`}>Region</label>
              <select
                className={styles.formInput}
                value={newKeyData.region}
                onChange={(e) => handleNewKeyDataChange('region', e.target.value)}
              >
                {regionOptions.map((option) => (
                  <option key={option.name.toString()} value={option.name.toString()}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                disabled={isLoading || !newKeyData.ssh_key_name || !newKeyData.ssh_public_key}
              >
                {isLoading ? 'Adding...' : 'Add Key'}
              </button>
            </div>

            <Dialog.Close asChild>
              <button className={styles.closeButton} aria-label="Close">
                <Cross2Icon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete SSH Key Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit SSH Key Modal */}
      <Dialog.Root open={isEditKeyModalOpen} onOpenChange={setIsEditKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
            <Dialog.Title className={styles.modalTitle}>Edit SSH Key</Dialog.Title>
            <Dialog.Description className={styles.modalDescription}>Update the name of your SSH key</Dialog.Description>

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
                <input type="text" className={styles.formInput} value={keyToEdit.region} disabled />
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default ProfilePage
