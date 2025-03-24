'use client'
import React, { ReactElement } from 'react'
import { ChevronUpIcon } from '@radix-ui/react-icons'
import * as Popover from '@radix-ui/react-popover'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/api/Auth'
import WalletButton from '@/components/button/WalletButton'
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

const TrainingIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="globe-training-icon" />
const InstanceIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="gpu-icon" />
const TemplatesIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="templates-icon" />
const CreateClusterIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="create-cluster-icon" />
const ClustersIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="clusters-icon" />
const QuoteIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="quote-icon" />
const BillingIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="billing-icon" />
const ProfileIcon = () => <DynamicSvgIcon height={26} className="rounded-none" iconName="profile-icon" />

export const sidebarClusterMenu: SidebarMenu[] = [
  { name: 'Deploy GPU Instance', href: '/dashboard/create-cluster', icon: <CreateClusterIcon /> },
  { name: 'Multi-Node Cluster', href: '/dashboard/clusters', icon: <ClustersIcon /> },
  { name: 'Team Instances', href: '/dashboard/instances', icon: <InstanceIcon /> },
  { name: 'Templates', href: '/dashboard/templates', icon: <TemplatesIcon /> },
  { name: 'Reserved Instances', href: '/dashboard/quotes', icon: <QuoteIcon /> },
  { name: 'Intelligence', href: '/dashboard/intelligence', icon: <TrainingIcon /> },
  { name: 'Billing', href: '/dashboard/billing', icon: <BillingIcon /> },
  // { name: 'Profile', href: '/dashboard/profile', icon: <ProfileIcon /> }
  // { name: 'Providers', href: '/dashboard/providers', icon: <ProvidersIcon /> },
  // { name: 'Support', href: '/dashboard/support', icon: <SupportIcon /> },
  // { name: 'Create Team', href: '/dashboard/createTeam', icon: <TeamsIcon /> },
  // { name: 'Documentation', href: '/dashboard/documentation', icon: <DocumentationIcon /> }
]

export const Sidebar = () => {
  const path = usePathname()

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
              <Image src="/logo/logo.avif" alt="Logo" width={22} height={22} className={styles.imageButton} priority />
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
                <Image
                  src="/logo/logo.avif"
                  alt="Logo"
                  width={20}
                  height={20}
                  className={styles.imageButton}
                  priority
                />
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
            <Flex justify="center" gap="4">
              <div className={styles.walletButton}>
                <WalletButton />
              </div>
            </Flex>
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
                  <Image
                    src="/icons/avatar.png"
                    alt=""
                    width={32}
                    height={32}
                    style={{ width: 'auto', borderRadius: '50%' }}
                  ></Image>
                  <div className={styles.userLinkButton}>Authenticated User</div>
                  <div>
                    <ChevronUpIcon />
                  </div>
                </div>
              </Popover.Trigger>

              <Popover.Content side="top" align="center" className={styles.popoverContent}>
                <div className={styles.popoverInner}>
                  <ul className={styles.popoverMenu}>
                    <li className={styles.logoutButton} onClick={signout}>
                      <Flex align="center" gap="4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="h-6 w-6 shrink-0 text-slate-200"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                          ></path>
                        </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 shrink-0 text-slate-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                ></path>
              </svg>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}
