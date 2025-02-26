'use client'
import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import * as Popover from '@radix-ui/react-popover'
import { Flex } from '@radix-ui/themes'
import Image from 'next/image'
import { signout } from '@/api/Auth'
import { HeaderDialog } from '@/components/dialog/HeaderDialog'
import styles from './Header.module.css'

export const Header = () => {
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
                <Image
                  src="/icons/avatar.png"
                  alt=""
                  width={24}
                  height={24}
                  style={{ width: 'auto', borderRadius: '50%' }}
                ></Image>
                <Flex ml="0">
                  <ChevronDownIcon />
                </Flex>
              </div>
            </Popover.Trigger>

            <Popover.Content align="center" className={styles.popoverContent}>
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
        </Flex>
      </Flex>
    </header>
  )
}
