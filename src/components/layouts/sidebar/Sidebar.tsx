'use client'
import type { ReactElement } from 'react'
import { ChevronUpIcon } from '@radix-ui/react-icons'
import * as Popover from '@radix-ui/react-popover'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import styles from './Sidebar.module.css'

type Option = {
  name?: string
  href?: string
}

type SidebarMenu = {
  name: string
  href: string
  icon: ReactElement
  options?: Option[]
}

const InstanceIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="gpu-icon" />
const CreateClusterIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="create-cluster-icon" />
const QuoteIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="quote-icon" />
const BillingIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="billing-icon" />
const ProfileIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="profile-icon" />
const LogoutIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="logout-icon" />

export const sidebarClusterMenu: SidebarMenu[] = [
  { name: 'Deploy GPU Instance', href: '/dashboard/create-cluster', icon: <CreateClusterIcon /> },
  { name: 'Instances', href: '/dashboard/instances', icon: <InstanceIcon /> },
  { name: 'Reserved Instances', href: '/dashboard/quotes', icon: <QuoteIcon /> },
  { name: 'Billing', href: '/dashboard/billing', icon: <BillingIcon /> },
  { name: 'Profile', href: '/dashboard/profile', icon: <ProfileIcon /> }
]

export const Sidebar = () => {
  const path = usePathname()
  // Use the UserContext instead of direct API calls
  const { user, isLoading: isLoadingUser, logout } = useUser()

  // Helper function to check if a path is active, including sub-paths for profile
  const isPathActive = (menuHref: string) => {
    if (menuHref === '/dashboard/profile') {
      // For profile, check if the current path starts with the profile path
      return path === menuHref || path.startsWith(`${menuHref}/`)
    }
    // For other menu items, use exact match
    return path === menuHref
  }

  return (
    <Flex
      direction="column"
      justify="between"
      display={{ initial: 'none', sm: 'flex' }}
      p="4"
      className={styles.sidebar}
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" mb="6">
          <>
            <Image src="/logo/logo.jpg" alt="Logo" width={32} height={32} className={styles.imageButton} priority />
            <div className={styles.logoText}>rLoop GPU Marketplace</div>
            <Image src="/logo/bell-icon.svg" alt="Notification Bell" width={15} height={15} style={{ width: 'auto' }} />
          </>
        </Flex>
        <>
          {sidebarClusterMenu.map((menu) =>
            menu.href == '/dashboard/create-cluster' ? (
              <Link
                key={menu.name}
                href={menu.href}
                className={`${styles.menu} ${path === menu.href ? styles.createClusterButton : styles.createClusterButtonDefault}`}
              >
                <div className={styles.linkButton}>
                  {menu.icon}
                  {menu.name}
                </div>
              </Link>
            ) : menu.href == '/dashboard/billing' ? (
              <Flex key={menu.name} width="100%" direction="column" gap="2">
                <div className={styles.sidebarText}>Settings</div>
                <Link
                  key={menu.name}
                  href={menu.href}
                  className={`${styles.menu} ${isPathActive(menu.href) ? styles.current : ''}`}
                >
                  <div className={styles.linkButton}>
                    {menu.icon}
                    {menu.name}
                  </div>
                </Link>
              </Flex>
            ) : (
              <Link
                key={menu.name}
                href={menu.href}
                className={`${styles.menu} ${isPathActive(menu.href) ? styles.current : ''}`}
              >
                <div className={styles.linkButton}>
                  {menu.icon}
                  {menu.name}
                </div>
              </Link>
            )
          )}
        </>
      </Flex>
      <Flex mt="4" direction="column" gap="4">
        <Popover.Root>
          <Popover.Trigger asChild>
            <div className={styles.userLinkGroup}>
              {isLoadingUser ? (
                <div className={styles.avatarPlaceholder}></div>
              ) : user?.avatar ? (
                <Image
                  src={user.avatar || '/placeholder.svg'}
                  alt=""
                  width={32}
                  height={32}
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                />
              ) : (
                <div className={styles.avatarInitial}>{user?.email ? user.email.charAt(0).toUpperCase() : '?'}</div>
              )}
              <div className={styles.userLinkButton}>
                {isLoadingUser ? 'Loading...' : user?.email || 'Authenticated User'}
              </div>
              <div>
                <ChevronUpIcon />
              </div>
            </div>
          </Popover.Trigger>

          <Popover.Content side="top" align="center" className={styles.popoverContent}>
            <div className={styles.popoverInner}>
              <ul className={styles.popoverMenu}>
                <li className={styles.profileButton}>
                  <Link href="/dashboard/profile" className={styles.profileLink}>
                    <Flex align="center" gap="4">
                      <ProfileIcon />
                      <div className={styles.userLinkButton}>Profile</div>
                    </Flex>
                  </Link>
                </li>
                <li className={styles.logoutButton} onClick={logout}>
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
  )
}
