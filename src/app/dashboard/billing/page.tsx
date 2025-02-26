import React from 'react'
import { Flex } from '@radix-ui/themes'
import styles from './page.module.css'

const Billing = () => {
  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Billing</div>
            <div className={styles.subTitle}>Your transactions and billing history</div>
          </Flex>
        </Flex>
      </Flex>
      <Flex p="4">Billing</Flex>
    </Flex>
  )
}

export default Billing
