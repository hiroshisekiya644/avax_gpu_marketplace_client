'use client'
import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Flex } from '@radix-ui/themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import WalletButton from '../button/WalletButton'
import { sidebarClusterMenu } from '../layouts/sidebar/Sidebar'
import styles from './HeaderDialog.module.css'

export const HeaderDialog = () => {
  const path = usePathname()

  return (
    <Dialog.Content className={styles.modal}>
      <Flex className={styles.modalHeader}>
        <Dialog.Title className={styles.heading}>rLoop GPU Marketplace</Dialog.Title>
        <Dialog.Close asChild>
          <button>×</button>
        </Dialog.Close>
      </Flex>
      <Flex className={styles.menuList}>
        <Flex justify="center">
          <div className={styles.walletButton}>
            <WalletButton />
          </div>
        </Flex>
        {sidebarClusterMenu.map((menu) => (
          <Dialog.Close
            key={menu.name}
            className={`${styles.menu} ${path.startsWith(menu.href) ? styles.current : ''}`}
            asChild
          >
            <Link href={menu.href}>{menu.name}</Link>
          </Dialog.Close>
        ))}
      </Flex>
    </Dialog.Content>
  )
}
