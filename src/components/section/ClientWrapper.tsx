import type React from 'react'
import { Flex } from '@radix-ui/themes'
import { Header } from '../layouts/header/Header'
import { Sidebar } from '../layouts/sidebar/Sidebar'
import styles from './ClientWrapper.module.css'

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Flex>
      <Header />
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </Flex>
  )
}

export default ClientWrapper
