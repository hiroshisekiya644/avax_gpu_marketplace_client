'use client'

import type React from 'react'

import { useCallback, useState, useEffect } from 'react'
import { Flex, Button, TextField } from '@radix-ui/themes'
import Image from 'next/image'
import { getBalance, createDeposit } from '@/api/Payment'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import styles from './page.module.css'

const WalletIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="wallet-icon" />
const CryptoIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="crypto-icon" />
const HistoryIcon = () => <DynamicSvgIcon height={24} className="rounded-none" iconName="history-icon" />

/**
 * Enhanced Billing component for managing user balance and deposits
 */
const Billing = () => {
  const [credit, setCredit] = useState<number | ''>('')
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')

  // Sample transaction data - would be replaced with actual API data
  const sampleTransactions = [
    { id: 1, date: '2024-03-20', type: 'Deposit', amount: 100, status: 'Completed', currency: 'AVAX' },
    { id: 2, date: '2024-03-15', type: 'Usage', amount: -25.5, status: 'Completed', currency: 'USD' },
    { id: 3, date: '2024-03-10', type: 'Deposit', amount: 50, status: 'Completed', currency: 'USDT' }
  ]

  // Fetch initial balance on component mount
  useEffect(() => {
    fetchBalance()
    // In a real implementation, you would fetch transaction history here
    setTransactions(sampleTransactions)
  }, [])

  /**
   * Fetch user balance from the API
   */
  const fetchBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedBalance = await getBalance()
      setBalance(fetchedBalance)
    } catch (err) {
      console.error('Balance fetch error:', err)
      setError('Failed to fetch balance')
      Snackbar({ message: 'Failed to fetch balance. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle credit input changes with validation
   */
  const handleCredit = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setCredit(value === '' ? '' : Number.parseFloat(value))
    }
  }, [])

  /**
   * Process deposit request and update balance
   */
  const handleDeposit = async () => {
    if (!credit || credit <= 0) {
      setError('Please enter a valid amount')
      Snackbar({ message: 'Please enter a valid amount' })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { invoiceUrl } = await createDeposit(credit)
      window.open(invoiceUrl, '_self')

      // After successful deposit, update the balance
      const updatedBalance = await getBalance()
      setBalance(updatedBalance)
      setCredit('')

      // In a real implementation, you would refresh transaction history here
      Snackbar({ message: 'Deposit initiated successfully' })
    } catch (err) {
      console.error('Deposit error:', err)
      setError('Deposit failed. Please try again later.')
      Snackbar({ message: 'Deposit failed. Please try again later.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between" width="100%">
          <Flex direction="column">
            <div className={styles.headerTitle}>Billing & Payments</div>
            <div className={styles.subTitle}>Manage your account balance and payment history</div>
          </Flex>
        </Flex>
      </Flex>

      <Flex className={styles.content} p="4" gap="4">
        {/* Left column - Balance and Add Funds */}
        <Flex direction="column" className={styles.leftColumn}>
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'history' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Transaction History
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
              <div className={styles.balanceCard}>
                <div className={styles.balanceHeader}>
                  <WalletIcon />
                  <h2>Current Balance</h2>
                </div>
                <div className={styles.balanceAmount}>${balance.toFixed(2)}</div>
                <div className={styles.balanceDescription}>Your available funds for GPU compute resources</div>
              </div>

              <div className={styles.addCreditCard}>
                <div className={styles.addCreditHeader}>
                  <CryptoIcon />
                  <h2>Add Funds</h2>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.addCreditForm}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="creditAmount">Amount (USD)</label>
                    <TextField.Root
                      id="creditAmount"
                      placeholder="Enter amount"
                      className={styles.creditInput}
                      onChange={handleCredit}
                      value={credit.toString()}
                    >
                      <TextField.Slot>$</TextField.Slot>
                    </TextField.Root>
                  </div>

                  <div className={styles.suggestedAmounts}>
                    <button className={styles.amountButton} onClick={() => setCredit(10)}>
                      $10
                    </button>
                    <button className={styles.amountButton} onClick={() => setCredit(50)}>
                      $50
                    </button>
                    <button className={styles.amountButton} onClick={() => setCredit(100)}>
                      $100
                    </button>
                    <button className={styles.amountButton} onClick={() => setCredit(500)}>
                      $500
                    </button>
                  </div>

                  <Button className={styles.addCreditButton} onClick={handleDeposit} disabled={loading}>
                    {loading ? 'Processing...' : 'Add Funds'}
                  </Button>
                </div>

                <div className={styles.paymentMethods}>
                  <div className={styles.paymentMethodsTitle}>Accepted Cryptocurrencies</div>
                  <div className={styles.paymentMethodsIcons}>
                    <div className={styles.cryptoItem}>
                      <Image src="/icons/avax.svg" alt="AVAX" width={24} height={24} />
                      <span>AVAX</span>
                    </div>
                    <div className={styles.cryptoItem}>
                      <Image src="/icons/usdt.svg" alt="USDT" width={24} height={24} />
                      <span>USDT</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.pricingCard}>
                <h2>Compute Pricing</h2>
                <div className={styles.pricingTable}>
                  <div className={styles.pricingRow}>
                    <div>H100 80GB SXM</div>
                    <div>$2.55/hr</div>
                  </div>
                  <div className={styles.pricingRow}>
                    <div>A100 80GB SXM</div>
                    <div>$1.80/hr</div>
                  </div>
                  <div className={styles.pricingRow}>
                    <div>A100 40GB SXM</div>
                    <div>$1.10/hr</div>
                  </div>
                </div>
                <div className={styles.pricingNote}>Prices are per GPU. Multi-GPU instances available.</div>
              </div>
            </>
          ) : (
            <div className={styles.historyCard}>
              <div className={styles.historyHeader}>
                <HistoryIcon />
                <h2>Transaction History</h2>
              </div>

              {transactions.length === 0 ? (
                <div className={styles.noTransactions}>No transaction history available</div>
              ) : (
                <div className={styles.transactionTable}>
                  <div className={styles.transactionHeader}>
                    <div>Date</div>
                    <div>Type</div>
                    <div>Amount</div>
                    <div>Status</div>
                  </div>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className={styles.transactionRow}>
                      <div>{transaction.date}</div>
                      <div>{transaction.type}</div>
                      <div className={transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount}>
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount.toFixed(2)} {transaction.currency}
                      </div>
                      <div className={styles.transactionStatus}>{transaction.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Flex>

        {/* Right column - FAQ and Support */}
        <Flex direction="column" className={styles.rightColumn}>
          <div className={styles.faqCard}>
            <h2>Frequently Asked Questions</h2>

            <div className={styles.faqItem}>
              <h3>How do payments work?</h3>
              <p>
                You can add funds to your account using AVAX or USDT cryptocurrencies. These funds are used to pay for
                GPU compute resources.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3>How are charges calculated?</h3>
              <p>You are charged based on the GPU type and usage duration. Prices are per hour of usage.</p>
            </div>

            <div className={styles.faqItem}>
              <h3>Can I get a refund?</h3>
              <p>Unused funds can be refunded within 30 days of deposit. Contact support for assistance.</p>
            </div>

            <div className={styles.faqItem}>
              <h3>Is there a minimum deposit?</h3>
              <p>The minimum deposit amount is $10 equivalent in cryptocurrency.</p>
            </div>
          </div>

          <div className={styles.supportCard}>
            <h2>Need Help?</h2>
            <p>Our support team is available to assist you with any billing or payment questions.</p>
            <Button className={styles.supportButton}>Contact Support</Button>
          </div>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Billing
