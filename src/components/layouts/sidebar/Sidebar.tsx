'use client'
import type { ReactElement } from 'react'
import { useState, useEffect } from 'react'
import { ChevronUpIcon } from '@radix-ui/react-icons'
import * as Popover from '@radix-ui/react-popover'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/api/Auth'
import { getUserData, type User } from '@/api/User'
// import WalletButton from '@/components/button/WalletButton'
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

// const TrainingIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="globe-training-icon" />
const InstanceIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="gpu-icon" />
// const TemplatesIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="templates-icon" />
const CreateClusterIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="create-cluster-icon" />
// const ClustersIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="clusters-icon" />
const QuoteIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="quote-icon" />
const BillingIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="billing-icon" />
const ProfileIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="profile-icon" />
const LogoutIcon = () => <DynamicSvgIcon height={22} className="rounded-none" iconName="logout-icon" />

export const sidebarClusterMenu: SidebarMenu[] = [
  { name: 'Deploy GPU Instance', href: '/dashboard/create-cluster', icon: <CreateClusterIcon /> },
  // { name: 'Multi-Node Cluster', href: '/dashboard/clusters', icon: <ClustersIcon /> },
  { name: 'Instances', href: '/dashboard/instances', icon: <InstanceIcon /> },
  // { name: 'Templates', href: '/dashboard/templates', icon: <TemplatesIcon /> },
  { name: 'Reserved Instances', href: '/dashboard/quotes', icon: <QuoteIcon /> },
  // { name: 'Intelligence', href: '/dashboard/intelligence', icon: <TrainingIcon /> },
  { name: 'Billing', href: '/dashboard/billing', icon: <BillingIcon /> },
  { name: 'Profile', href: '/dashboard/profile', icon: <ProfileIcon /> }
  // { name: 'Providers', href: '/dashboard/providers', icon: <ProvidersIcon /> },
  // { name: 'Support', href: '/dashboard/support', icon: <SupportIcon /> },
  // { name: 'Create Team', href: '/dashboard/createTeam', icon: <TeamsIcon /> },
  // { name: 'Documentation', href: '/dashboard/documentation', icon: <DocumentationIcon /> }
]

export const Sidebar = () => {
  const path = usePathname()
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
    <Flex
      direction="column"
      justify="between"
      display={{ initial: 'none', sm: 'flex' }}
      p="4"
      className={path == '/dashboard/intelligence' ? styles.miniSidebar : styles.sidebar}
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" mb="6">
          {path !== '/dashboard/intelligence' ? (
            <>
              <Image src="/logo/logo.jpg" alt="Logo" width={32} height={32} className={styles.imageButton} priority />
              <div className={styles.logoText}>AVAX GPU MARKETPLACE</div>
              <Image
                src="/logo/bell-icon.svg"
                alt="Notification Bell"
                width={15}
                height={15}
                style={{ width: 'auto' }}
              />
            </>
          ) : (
            <>
              <Flex justify="center" width="100%">
                <Image src="/logo/logo.jpg" alt="Logo" width={24} height={24} className={styles.imageButton} priority />
              </Flex>
            </>
          )}
        </Flex>
        {path !== '/dashboard/intelligence' ? (
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
                    className={`${styles.menu} ${path === menu.href ? styles.current : ''}`}
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
                  className={`${styles.menu} ${path === menu.href ? styles.current : ''}`}
                >
                  <div className={styles.linkButton}>
                    {menu.icon}
                    {menu.name}
                  </div>
                </Link>
              )
            )}
          </>
        ) : (
          <>
            {sidebarClusterMenu.map((menu) => (
              <Link
                key={menu.name}
                href={menu.href}
                className={`${styles.menu} ${path === menu.href ? styles.current : ''}`}
              >
                <div className={styles.miniLinkButton}>{menu.icon}</div>
              </Link>
            ))}
          </>
        )}
      </Flex>
      <Flex mt="4" direction="column" gap="4">
        {path !== '/dashboard/intelligence' ? (
          <>
            {/* <Flex justify="center" gap="4">
              <div className={styles.walletButton}>
                <WalletButton />
              </div>
            </Flex> */}
            <Flex justify="center" gap="4">
              <Link href="/termsOfService" className={styles.textButton}>
                Terms of Service
              </Link>
              <Link href="/privacy" className={styles.textButton}>
                Privacy and Policy
              </Link>
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
                      width={32}
                      height={32}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                  ) : (
                    <div className={styles.avatarInitial}>
                      {userData?.email ? userData.email.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div className={styles.userLinkButton}>
                    {isLoadingUser ? 'Loading...' : userData?.email || 'Authenticated User'}
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
          </>
        ) : (
          <>
            <Flex justify="center" className={styles.logoutIconButton} onClick={signout}>
              <LogoutIcon />
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}
