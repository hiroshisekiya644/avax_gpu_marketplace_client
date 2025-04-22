'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Flex, Theme } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserData, updateUser, deleteUserAccount, type User } from '@/api/User'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useBalance } from '@/context/BalanceContext'
import styles from '../page.module.css'

// Icons
const ProfileIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="profile-icon" />
const KeyIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="key-icon" />
const EmailIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="email-icon" />
const WalletIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="wallet-icon" />
const CalendarIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="calendar-icon" />
const LockIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="lock-icon" />
const WarningIcon = () => <DynamicSvgIcon height={18} className="rounded-none" iconName="warning-icon" />

const AccountPage = () => {
  const router = useRouter()
  const { balance, isLoading: balanceLoading } = useBalance()

  // User data state
  const [userData, setUserData] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const response = await getUserData()
      setUserData(response.user)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      Snackbar({ message: 'Failed to fetch user data', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdatePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Snackbar({ message: 'New passwords do not match', type: 'error' })
      return
    }

    if (passwordData.newPassword.length < 8) {
      Snackbar({ message: 'Password must be at least 8 characters', type: 'error' })
      return
    }

    try {
      setIsUpdating(true)
      await updateUser({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      Snackbar({ message: 'Password updated successfully' })
    } catch (error) {
      console.error('Failed to update password:', error)
      Snackbar({ message: 'Failed to update password', type: 'error' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsUpdating(true)
      await deleteUserAccount()
      Snackbar({ message: 'Account deleted successfully' })

      // Clear session storage and redirect to login
      localStorage.clear()
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to delete account:', error)
      Snackbar({ message: 'Failed to delete account', type: 'error' })
      setIsUpdating(false)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Account Settings</div>
            <div className={styles.subTitle}>Manage your personal information and account security</div>
          </Flex>
        </Flex>
      </Flex>

      <Flex p="4">
        <div className={styles.wrapper}>
          {/* Navigation Tabs */}
          <div className={styles.tabList}>
            <Link href="/dashboard/profile/account" className={`${styles.tabListItem} ${styles.activeTab}`}>
              <Flex gap="1">
                <ProfileIcon />
                Account
              </Flex>
            </Link>
            <Link href="/dashboard/profile/ssh-keys" className={styles.tabListItem}>
              <Flex gap="1">
                <KeyIcon />
                SSH Keys
              </Flex>
            </Link>
          </div>

          {/* Account Settings Content */}
          <div className={styles.tabContent}>
            {isLoading ? (
              <div className={styles.skeletonContainer}>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonAvatar}></div>
                  <div className={styles.skeletonInfo}>
                    <div className={styles.skeletonName}></div>
                    <div className={styles.skeletonEmail}></div>
                    <div className={styles.skeletonBadges}>
                      <div className={styles.skeletonBadge}></div>
                      <div className={styles.skeletonBadge}></div>
                    </div>
                  </div>
                </div>
                <div className={styles.skeletonGrid}>
                  <div className={styles.skeletonCard}></div>
                  <div className={styles.skeletonCard}></div>
                  <div className={styles.skeletonCard}></div>
                </div>
                <div className={styles.skeletonCard} style={{ height: '200px' }}></div>
                <div className={styles.skeletonCard} style={{ height: '120px' }}></div>
              </div>
            ) : (
              <Flex direction="column" mt="4">
                <div className={styles.profileHeader}>
                  <div className={styles.avatarLarge}>
                    {userData?.avatar ? (
                      <Image
                        src={userData.avatar || '/placeholder.svg'}
                        alt="Profile"
                        width={120}
                        height={120}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      userData?.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={styles.profileInfo}>
                    <h1 className={styles.profileName}>{userData?.email.split('@')[0]}</h1>
                    <p className={styles.profileEmail}>{userData?.email}</p>
                    <div className={styles.profileMeta}>
                      <span className={styles.profileBadge}>
                        {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
                      </span>
                      <span className={styles.profileBadge}>
                        Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardGrid}>
                  <div className={`${styles.card} ${styles.cardHover}`}>
                    <div className={styles.cardIconHeader}>
                      <div className={styles.cardIcon}>
                        <EmailIcon />
                      </div>
                      <h2 className={styles.cardTitle}>Email Address</h2>
                    </div>
                    <p className={styles.cardValue}>{userData?.email}</p>
                    <p className={styles.cardNote}>Your email address is used for login and cannot be changed</p>
                  </div>

                  <div className={`${styles.card} ${styles.cardHover}`}>
                    <div className={styles.cardIconHeader}>
                      <div className={styles.cardIcon}>
                        <WalletIcon />
                      </div>
                      <h2 className={styles.cardTitle}>Account Balance</h2>
                    </div>
                    <p className={styles.cardValue}>${balanceLoading ? 'Loading...' : balance.toFixed(2)}</p>
                    <p className={styles.cardNote}>Your current account balance</p>
                    <Flex justify="end" mt="3">
                      <Link href="/dashboard/billing" className={styles.addFundsButton}>
                        Add Funds
                      </Link>
                    </Flex>
                  </div>

                  <div className={`${styles.card} ${styles.cardHover}`}>
                    <div className={styles.cardIconHeader}>
                      <div className={styles.cardIcon}>
                        <CalendarIcon />
                      </div>
                      <h2 className={styles.cardTitle}>Account Created</h2>
                    </div>
                    <p className={styles.cardValue}>
                      {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : ''}
                    </p>
                    <p className={styles.cardNote}>Date when your account was created</p>
                  </div>
                </div>

                <div className={`${styles.card} ${styles.securityCard}`}>
                  <div className={styles.cardIconHeader}>
                    <div className={styles.cardIcon}>
                      <LockIcon />
                    </div>
                    <h2 className={styles.cardTitle}>Account Security</h2>
                  </div>
                  <p className={styles.cardDescription}>Update your password to keep your account secure</p>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div className={styles.passwordGroup}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm New Password</label>
                      <input
                        type="password"
                        className={styles.formInput}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className={styles.passwordRequirements}>
                    <p className={styles.requirementTitle}>Password requirements:</p>
                    <ul className={styles.requirementList}>
                      <li className={passwordData.newPassword.length >= 8 ? styles.requirementMet : ''}>
                        At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                        At least one uppercase letter
                      </li>
                      <li className={/[0-9]/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                        At least one number
                      </li>
                    </ul>
                  </div>

                  <Flex justify="end">
                    <button
                      className={styles.button}
                      onClick={handleUpdatePassword}
                      disabled={
                        isUpdating ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                    >
                      {isUpdating ? 'Updating...' : 'Update Password'}
                    </button>
                  </Flex>
                </div>

                <div className={`${styles.card} ${styles.dangerCard}`}>
                  <div className={styles.cardIconHeader}>
                    <div className={`${styles.cardIcon} ${styles.dangerIcon}`}>
                      <WarningIcon />
                    </div>
                    <h2 className={styles.cardTitle}>Danger Zone</h2>
                  </div>
                  <p className={styles.cardDescription}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>

                  <div className={styles.dangerZoneBox}>
                    <div>
                      <h3 className={styles.dangerZoneTitle}>Delete Account</h3>
                      <p className={styles.dangerZoneDescription}>
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                    <button className={styles.buttonDanger} onClick={() => setIsDeleteModalOpen(true)}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </Flex>
            )}
          </div>
        </div>
      </Flex>

      {/* Delete Account Confirmation Modal */}
      <Dialog.Root open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.modalOverlay} />
          <Dialog.Content className={styles.modalContent}>
            <Theme>
              <Dialog.Title className={styles.modalTitle}>Delete Account</Dialog.Title>
              <Dialog.Description className={styles.modalDescription}>
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete
                all your data.
              </Dialog.Description>

              <div className={styles.deleteWarning}>
                <WarningIcon />
                <p>This will delete all your data, including SSH keys, clusters, and payment information.</p>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button className={styles.buttonDanger} onClick={handleDeleteAccount} disabled={isUpdating}>
                  {isUpdating ? 'Deleting...' : 'Delete Account'}
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

export default AccountPage
