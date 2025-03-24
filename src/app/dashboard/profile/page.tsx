'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Button, Flex } from '@radix-ui/themes'
import Image from 'next/image'
import {
  getUserKeyPairs,
  importKeyPair,
  updateKeyPair,
  deleteKeyPair,
  type KeyPair,
  type KeyPairCreateData
} from '@/api/KeyPair'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormInput } from '@/components/input/FormInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

const ProfileIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="user-icon" />
const KeyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="key-icon" />
const PlusIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="plus-icon" />
const DeleteIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="trash-icon" />
const EditIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="edit-icon" />

type TabValue = 'profile' | 'ssh'
const tabValues: TabValue[] = ['profile', 'ssh']
const tabListItems = [
  { name: 'Profile', icon: <ProfileIcon />, value: 'profile' },
  { name: 'SSH Keys', icon: <KeyIcon />, value: 'ssh' }
]

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<TabValue>(tabValues[0])
  const [addKeyModalOpen, setAddKeyModalOpen] = useState(false)
  const [editKeyModalOpen, setEditKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyContent, setNewKeyContent] = useState('')
  const [editKeyId, setEditKeyId] = useState<number | null>(null)
  const [editKeyName, setEditKeyName] = useState('')
  const [sshKeys, setSSHKeys] = useState<KeyPair[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile form state
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john.doe@example.com')
  const [company, setCompany] = useState('AVAX Technologies')
  const [location, setLocation] = useState('San Francisco, CA')
  const [bio, setBio] = useState('AI and GPU enthusiast')

  // Fetch SSH keys when SSH tab is selected
  useEffect(() => {
    if (activeTab === 'ssh') {
      fetchSSHKeys()
    }
  }, [activeTab])

  const fetchSSHKeys = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getUserKeyPairs()
      setSSHKeys(response.keyPairs)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch SSH keys'
      setError(errorMsg)
      Snackbar({ message: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value)
  }

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKeyContent.trim()) {
      Snackbar({ message: 'Key name and content are required' })
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const keyPairData: KeyPairCreateData = {
        ssh_key_name: newKeyName,
        ssh_public_key: newKeyContent,
        region: 'default' // Using a default value since region selection is removed
      }
      const response = await importKeyPair(keyPairData)
      setSSHKeys([response.keypair, ...sshKeys])
      setNewKeyName('')
      setNewKeyContent('')
      setAddKeyModalOpen(false)
      Snackbar({ message: response.message || 'SSH key added successfully' })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add SSH key'
      setError(errorMsg)
      Snackbar({ message: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditKey = (key: KeyPair) => {
    setEditKeyId(key.id)
    setEditKeyName(key.ssh_key_name)
    setEditKeyModalOpen(true)
  }

  const handleUpdateKey = async () => {
    if (!editKeyId || !editKeyName.trim()) {
      Snackbar({ message: 'Key name is required' })
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await updateKeyPair(editKeyId, { name: editKeyName })
      setSSHKeys(sshKeys.map((key) => (key.id === editKeyId ? response.keypair : key)))
      setEditKeyModalOpen(false)
      Snackbar({ message: response.message || 'SSH key updated successfully' })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update SSH key'
      setError(errorMsg)
      Snackbar({ message: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKey = async (id: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await deleteKeyPair(id)
      setSSHKeys(sshKeys.filter((key) => key.id !== id))
      Snackbar({ message: response.message || 'SSH key deleted successfully' })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete SSH key'
      setError(errorMsg)
      Snackbar({ message: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = () => {
    Snackbar({ message: 'Profile updated successfully' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
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
            <div className={styles.headerTitle}>Account Settings</div>
            <div className={styles.subTitle}>Manage your profile and security settings</div>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4">
        <Tabs.Root
          value={activeTab}
          defaultValue="profile"
          className={styles.wrapper}
          onValueChange={(value) => setActiveTab(value as TabValue)}
        >
          <Tabs.List className={styles.tabList}>
            {tabListItems.map((item, i) => (
              <Tabs.Trigger key={i} value={item.value} className={styles.tabListItem}>
                <Flex gap="1">
                  {item.icon}
                  {item.name}
                </Flex>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Content value="profile" className={styles.tabContent}>
            <Flex direction="column" gap="4" mt="4">
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Profile Information</h2>
                <p className={styles.sectionDescription}>
                  Update your personal information and how others see you on the platform
                </p>

                <div className={styles.avatarSection}>
                  <div className={styles.avatarPreview}>
                    <Image
                      src="/icons/avatar.png"
                      alt="Profile Avatar"
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="avatar-upload" className={styles.avatarUploadButton}>
                      Change Avatar
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className={styles.fileInput} />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <FormInput
                    id="name"
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <FormInput
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled
                  />
                  <FormInput
                    id="company"
                    label="Company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                  <FormInput
                    id="location"
                    label="Location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <FormInput
                  id="bio"
                  label="Bio"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-4"
                />

                <Flex justify="end" mt="4" gap="2">
                  <Button className={styles.cancelButton}>Cancel</Button>
                  <Button className={styles.saveButton} onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                </Flex>
              </div>

              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Account Security</h2>
                <p className={styles.sectionDescription}>Manage your password and account security settings</p>

                <div className={styles.formGrid}>
                  <FormInput
                    id="current-password"
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                  />
                  <div></div>
                  <FormInput id="new-password" label="New Password" type="password" placeholder="Enter new password" />
                  <FormInput
                    id="confirm-password"
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>

                <Flex justify="end" mt="4" gap="2">
                  <Button className={styles.cancelButton}>Cancel</Button>
                  <Button className={styles.saveButton}>Update Password</Button>
                </Flex>
              </div>
            </Flex>
          </Tabs.Content>

          {/* SSH Keys Tab */}
          <Tabs.Content value="ssh" className={styles.tabContent}>
            <Flex direction="column" gap="4" mt="4">
              <div className={styles.sectionCard}>
                <Flex justify="between" align="center" mb="4">
                  <div>
                    <h2 className={styles.sectionTitle}>SSH Keys</h2>
                    <p className={styles.sectionDescription}>
                      SSH keys allow you to establish a secure connection between your computer and our platform
                    </p>
                  </div>
                  <Button className={styles.addKeyButton} onClick={() => setAddKeyModalOpen(true)} disabled={isLoading}>
                    <PlusIcon />
                    Add SSH Key
                  </Button>
                </Flex>

                {isLoading && sshKeys.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    p="6"
                    style={{ backgroundColor: 'var(--bgSoft)', borderRadius: '8px' }}
                  >
                    <p style={{ color: 'var(--textSoft)' }}>Loading SSH keys...</p>
                  </Flex>
                ) : error && sshKeys.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    p="6"
                    style={{ backgroundColor: 'var(--bgSoft)', borderRadius: '8px' }}
                  >
                    <p style={{ color: 'var(--textSoft)' }}>{error}</p>
                  </Flex>
                ) : sshKeys.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    p="6"
                    style={{ backgroundColor: 'var(--bgSoft)', borderRadius: '8px' }}
                  >
                    <KeyIcon />
                    <p style={{ marginTop: '10px', color: 'var(--textSoft)' }}>No SSH keys added yet</p>
                  </Flex>
                ) : (
                  <div>
                    {sshKeys.map((key) => (
                      <div key={key.id} className={styles.sshKeyCard}>
                        <div className={styles.sshKeyInfo}>
                          <div className={styles.sshKeyName}>{key.ssh_key_name}</div>
                          <div className={styles.sshKeyFingerprint}>{key.ssh_public_key.substring(0, 30)}...</div>
                          <div className={styles.sshKeyDate}>Added on {formatDate(key.createdAt)}</div>
                        </div>
                        <Flex gap="2">
                          <Button className={styles.editButton} onClick={() => handleEditKey(key)} disabled={isLoading}>
                            <EditIcon />
                          </Button>
                          <Button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={isLoading}
                          >
                            <DeleteIcon />
                          </Button>
                        </Flex>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>About SSH Keys</h2>
                <p className={styles.sectionDescription}>
                  SSH keys provide a more secure way of logging into servers and services compared to using a password
                  alone. With SSH keys, users can log in without having to remember complex passwords.
                </p>
                <p className={styles.sectionDescription}>
                  We recommend using ED25519 or RSA keys with a minimum of 2048 bits. Learn more about
                  <a href="#" style={{ color: 'var(--border)', marginLeft: '5px' }}>
                    generating SSH keys
                  </a>
                  .
                </p>
              </div>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      </Flex>

      {/* Add SSH Key Dialog */}
      <Dialog.Root open={addKeyModalOpen} onOpenChange={setAddKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title className={styles.dialogTitle}>Add New SSH Key</Dialog.Title>

            <div className={styles.modalFormInput}>
              <FormInput
                id="key-name"
                label="Key Name"
                type="text"
                placeholder="e.g. MacBook Pro"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className={styles.modalHint}>A descriptive name to identify this key</div>
            </div>

            <div className={styles.textAreaContainer}>
              <label htmlFor="key-content" className={styles.formLabel}>
                Key Content <span className={styles.formRequired}>*</span>
              </label>
              <textarea
                id="key-content"
                className={styles.textArea}
                placeholder="Paste your public SSH key here (begins with ssh-rsa, ssh-ed25519, etc.)"
                value={newKeyContent}
                onChange={(e) => setNewKeyContent(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className={styles.modalHint}>
                Your public SSH key content. This typically starts with "ssh-rsa" or "ssh-ed25519" and contains no line
                breaks
              </div>
            </div>

            <div className={styles.formActions}>
              <Button className={styles.cancelButton} onClick={() => setAddKeyModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button className={styles.saveButton} onClick={handleAddKey} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Key'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit SSH Key Dialog */}
      <Dialog.Root open={editKeyModalOpen} onOpenChange={setEditKeyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.dialogOverlay} />
          <Dialog.Content className={styles.dialogContent}>
            <Dialog.Title className={styles.dialogTitle}>Edit SSH Key</Dialog.Title>

            <div className={styles.modalFormInput}>
              <FormInput
                id="edit-key-name"
                label="Key Name"
                type="text"
                placeholder="e.g. MacBook Pro"
                value={editKeyName}
                onChange={(e) => setEditKeyName(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className={styles.modalHint}>A descriptive name to identify this key</div>
            </div>

            <div className={styles.formActions}>
              <Button className={styles.cancelButton} onClick={() => setEditKeyModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button className={styles.saveButton} onClick={handleUpdateKey} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Key'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default ProfilePage
