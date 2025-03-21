'use client'

import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { FormInput } from '@/components/input/FormInput'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useResize } from '@/utils/Helper'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Button, Flex } from '@radix-ui/themes'
import Image from 'next/image'
import { useState } from 'react'
import styles from './page.module.css'

const ProfileIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="user-icon" />
const KeyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="key-icon" />
const PlusIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="plus-icon" />
const TrashIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="trash-icon" />

type TabValue = 'profile' | 'ssh'
const tabValues: TabValue[] = ['profile', 'ssh']
const tabListItems = [
  { name: 'Profile', icon: <ProfileIcon />, value: 'profile' },
  { name: 'SSH Keys', icon: <KeyIcon />, value: 'ssh' }
]

// Sample SSH key data
const sampleSSHKeys = [
  {
    id: '1',
    name: 'MacBook Pro',
    fingerprint: 'SHA256:NHg8Jpn+rExRxr6a2Pbj9NBgMzlV/1oeE/fEXkDgYQ4',
    createdAt: '2023-10-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Work Desktop',
    fingerprint: 'SHA256:7Hj9Kpn+rExRxr6a2Pbj9NBgMzlV/1oeE/fEXkDgYQ4',
    createdAt: '2023-11-20T09:15:00Z'
  }
]

const ProfilePage = () => {
  const { isResponsive } = useResize()
  const [activeTab, setActiveTab] = useState<TabValue>(tabValues[0])
  const [addKeyModalOpen, setAddKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyContent, setNewKeyContent] = useState('')
  const [sshKeys, setSSHKeys] = useState(sampleSSHKeys)

  // Profile form state
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john.doe@example.com')
  const [company, setCompany] = useState('AVAX Technologies')
  const [location, setLocation] = useState('San Francisco, CA')
  const [bio, setBio] = useState('AI and GPU enthusiast')

  const handleTabChange = (value: TabValue) => {
    setActiveTab(value)
  }

  const handleAddKey = () => {
    if (!newKeyName.trim() || !newKeyContent.trim()) {
      Snackbar({ message: 'Key name and content are required' })
      return
    }

    // In a real app, you would send this to your backend
    const newKey = {
      id: `${Date.now()}`,
      name: newKeyName,
      fingerprint: 'SHA256:' + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString()
    }

    setSSHKeys([...sshKeys, newKey])
    setNewKeyName('')
    setNewKeyContent('')
    setAddKeyModalOpen(false)
    Snackbar({ message: 'SSH key added successfully' })
  }

  const handleDeleteKey = (id: string) => {
    setSSHKeys(sshKeys.filter((key) => key.id !== id))
    Snackbar({ message: 'SSH key deleted successfully' })
  }

  const handleSaveProfile = () => {
    // In a real app, you would send this to your backend
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
                  <Button className={styles.addKeyButton} onClick={() => setAddKeyModalOpen(true)}>
                    <PlusIcon />
                    Add SSH Key
                  </Button>
                </Flex>

                {sshKeys.length === 0 ? (
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
                          <div className={styles.sshKeyName}>{key.name}</div>
                          <div className={styles.sshKeyFingerprint}>{key.fingerprint}</div>
                          <div className={styles.sshKeyDate}>Added on {formatDate(key.createdAt)}</div>
                        </div>
                        <Button className={styles.deleteButton} onClick={() => handleDeleteKey(key.id)}>
                          <TrashIcon />
                        </Button>
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

            <FormInput
              id="key-name"
              label="Key Name"
              type="text"
              placeholder="e.g. MacBook Pro"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />

            <div className={styles.textAreaContainer}>
              <label htmlFor="key-content" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Key Content <span style={{ color: 'var(--border)' }}>*</span>
              </label>
              <textarea
                id="key-content"
                className={styles.textArea}
                placeholder="Paste your public SSH key here (begins with ssh-rsa, ssh-ed25519, etc.)"
                value={newKeyContent}
                onChange={(e) => setNewKeyContent(e.target.value)}
                required
              />
            </div>

            <Flex justify="end" gap="2" mt="4">
              <Button className={styles.cancelButton} onClick={() => setAddKeyModalOpen(false)}>
                Cancel
              </Button>
              <Button className={styles.saveButton} onClick={handleAddKey}>
                Add Key
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Flex>
  )
}

export default ProfilePage
