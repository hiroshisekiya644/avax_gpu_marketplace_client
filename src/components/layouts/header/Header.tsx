'use client'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Popover from '@radix-ui/react-popover'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { signout } from '@/api/Auth'
import { getUserData, type User } from '@/api/User'
import { HeaderDialog } from '@/components/dialog/HeaderDialog'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import styles from './Header.module.css'

const ProfileIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="profile-icon" />
const LogoutIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="logout-icon" />

export const Header = () => {
  // Add state for user data
  const [userData, setUserData] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true)
        const response = await getUserData()
        setUserData(response.user)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserData()
  }, [])

  return (
    <header className={styles.header}>
      <Flex align="center" justify="between" pl="2" width="100%">
        <Flex>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <li className={styles.hamburger}>
                <span></span>
                <span></span>
                <span></span>
              </li>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className={styles.overlay} />
              <HeaderDialog />
            </Dialog.Portal>
          </Dialog.Root>
          <Flex align="center" mt="0">
            <div className={styles.headerTitle}>Dashboard</div>
          </Flex>
        </Flex>
        <Flex mt="1" ml="auto">
          <Flex mt="2" mr="4">
            <Image src="/logo/bell-icon.svg" alt="Notification Bell" width={40} height={40} />
          </Flex>
          <Popover.Root>
            <Popover.Trigger asChild>
              <div className={styles.userLinkGroup}>
                {isLoadingUser ? (
                  <div className={styles.avatarPlaceholder}></div>
                ) : userData?.avatar ? (
                  <Image
                    src={userData.avatar || '/placeholder.svg'}
                    alt=""
                    width={24}
                    height={24}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                  />
                ) : (
                  <div className={styles.avatarInitial}>
                    {userData?.email ? userData.email.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <Flex ml="0">
                  <ChevronDownIcon />
                </Flex>
              </div>
            </Popover.Trigger>

            <Popover.Content align="center" className={styles.popoverContent}>
              <div className={styles.popoverInner}>
                {userData && (
                  <div className={styles.userInfo}>
                    <div className={styles.userEmail}>{userData.email}</div>
                  </div>
                )}
                <ul className={styles.popoverMenu}>
                  <li className={styles.profileButton}>
                    <Link href="/dashboard/profile" className={styles.profileLink}>
                      <Flex align="center" gap="4">
                        <ProfileIcon />
                        <div className={styles.userLinkButton}>Profile</div>
                      </Flex>
                    </Link>
                  </li>
                  <li className={styles.logoutButton} onClick={signout}>
                    <Flex align="center" gap="4">
                      <LogoutIcon />
                      <div className={styles.userLinkButton}>Logout</div>
                    </Flex>
                  </li>
                </ul>
              </div>
            </Popover.Content>
          </Popover.Root>
        </Flex>
      </Flex>
    </header>
  )
}
