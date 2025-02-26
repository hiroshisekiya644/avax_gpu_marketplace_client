import React from 'react'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import styles from './layout.module.css'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Theme>
      <main className={styles.main}>{children}</main>
    </Theme>
  )
}

export default Layout
