'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { Flex, Button, TextField } from '@radix-ui/themes'
import styles from './page.module.css'
import { getBalance, createDeposit } from '@/api/Payment'

const Billing = () => {
  const [credit, setCredit] = useState<number | ''>('')
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedBalance = await getBalance()
        setBalance(fetchedBalance)
      } catch (error) {
        setError('Failed to fetch balance')
      }
    }
    fetchData()
  }, [])

  const handleCredit = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setCredit(value === '' ? '' : parseFloat(value))
    }
  }, [])

  const handleDeposit = async () => {
    if (!credit || credit <= 0) {
      setError('Enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { invoiceUrl } = await createDeposit(credit)
      window.open(invoiceUrl, '_blank')

      const updatedBalance = await getBalance()
      setBalance(updatedBalance)
      setCredit('')
    } catch (error) {
      setError('Deposit failed. Try again later.')
    } finally {
      setLoading(false)
    }
  }

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

      <Flex m="4" p="8" gap="10px" justify="start" direction="column" align="start" className={styles.billingWrapper}>
        {error && <div className={styles.error}>{error}</div>}
        <Flex>Current Balance: ${balance.toFixed(2)}</Flex>
        <Flex align="center" gap="4">
          <div>Add Amount:</div>
          <TextField.Root
            placeholder="Enter amount"
            className={styles.credit}
            onChange={handleCredit}
            value={credit.toString()}
          >
            <TextField.Slot></TextField.Slot>
          </TextField.Root>
        </Flex>
        <Button mt="2" className={styles.billingButton} onClick={handleDeposit} disabled={loading}>
          {loading ? 'Processing...' : 'Add Credit'}
        </Button>
      </Flex>
    </Flex>
  )
}

export default Billing
