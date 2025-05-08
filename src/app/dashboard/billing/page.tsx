'use client'

import type React from 'react'

import { useCallback, useState, useEffect } from 'react'
import { Flex, Button, TextField } from '@radix-ui/themes'
import Image from 'next/image'
import { createDeposit, getPaymentHistory } from '@/api/Payment'
import DynamicSvgIcon from '@/components/icons/DynamicSvgIcon'
import { Snackbar } from '@/components/snackbar/SnackBar'
import { useUser } from '@/context/UserContext'
import styles from './page.module.css'

const WalletIcon = () => <DynamicSvgIcon height={22} className="wallet-none" iconName="wallet-icon" />
const CryptoIcon = () => <DynamicSvgIcon height={22} className="crypto-none" iconName="crypto-icon" />
const HistoryIcon = () => <DynamicSvgIcon height={22} className="history-none" iconName="history-icon" />
const OverviewIcon = () => <DynamicSvgIcon height={22} className="overview-none" iconName="overview-icon" />
const UsdtIcon = () => <DynamicSvgIcon height={22} className="overview-none" iconName="usdt" />

interface Transaction {
  id: string
  date: string
  type: string
  amount: number
  status: string
  currency: string
}

/**
 * Enhanced Billing component for managing user balance and deposits
 */
const Billing = () => {
  const [credit, setCredit] = useState<number | ''>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(true)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')

  // Use the user context instead of balance context
  const { user, isLoading: userLoading, refreshUserData } = useUser()
  const balance = user?.balance || 0

  // Fetch transaction history on component mount
  useEffect(() => {
    fetchTransactionHistory()
  }, [])

  /**
   * Fetch transaction history from the API
   */
  const fetchTransactionHistory = async () => {
    try {
      setTransactionsLoading(true)
      setTransactionsError(null)

      const history = await getPaymentHistory()

      // Transform the backend data to match our UI format
      const formattedTransactions = history.map((item, index) => {
        // For deposits, we'll determine currency based on transaction data
        // In a real implementation, this would come from the backend
        const currency = item.type === 'deposit' ? (index % 2 === 0 ? 'AVAX' : 'USDT') : 'USD'

        return {
          id: `${index}-${item.createdAt}`, // Generate a unique ID
          date: new Date(item.createdAt).toLocaleDateString(),
          type: item.type.charAt(0).toUpperCase() + item.type.slice(1), // Capitalize first letter
          amount: item.type === 'deposit' ? item.amount : -item.amount, // Positive for deposits, negative for usage
          status: item.status.charAt(0).toUpperCase() + item.status.slice(1), // Capitalize first letter
          currency
        }
      })

      setTransactions(formattedTransactions)
    } catch (err) {
      console.error('Transaction history fetch error:', err)
      setTransactionsError('Failed to fetch transaction history')
      // We'll show an error message in the UI
    } finally {
      setTransactionsLoading(false)
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
      await refreshUserData()
      setCredit('')

      // Refresh transaction history
      fetchTransactionHistory()

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
              <OverviewIcon />
              Overview
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'history' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <HistoryIcon />
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
                <div className={styles.balanceAmount}>${userLoading ? 'Loading...' : balance.toFixed(2)}</div>
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
                      <UsdtIcon />
                      <span>USDT</span>
                    </div>
                  </div>
                  <div className={styles.acceptedCryptoNote}>
                    Currently we only accept USDT on the Avalanche network.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.historyCard}>
              <div className={styles.historyHeader}>
                <h2>Transaction History</h2>
              </div>

              {transactionsLoading ? (
                <div className={styles.loadingTransactions}>Loading transaction history...</div>
              ) : transactionsError ? (
                <div className={styles.errorMessage}>{transactionsError}</div>
              ) : transactions.length === 0 ? (
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
                        {`${Math.abs(transaction.amount).toFixed(2)} ${transaction.currency}`}
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
                We accept USDT cryptocurrency on the Avalanche network. These funds are used to pay for GPU compute
                resources based on your usage.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3>How are charges calculated?</h3>
              <p>You are charged based on the GPU type and usage duration. Prices are per hour of usage.</p>
            </div>

            <div className={styles.faqItem}>
              <h3>Is there a minimum deposit?</h3>
              <p>The minimum deposit amount is $10 equivalent in AVAX or USDT.</p>
            </div>

            <div className={styles.faqItem}>
              <h3>Which cryptocurrencies do you accept?</h3>
              <p>
                We accept USDT (Tether) on the Avalanche network. You must use the Avalanche C-Chain for all
                transactions.
              </p>
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
