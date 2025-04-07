import type React from 'react'
import styles from './layout.module.css'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <main className={styles.main}>{children}</main>
}

export default Layout
