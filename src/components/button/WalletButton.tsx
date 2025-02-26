import React from 'react'
import { useWallet } from '@/context/Web3Context'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

export const formatAddress = (address: string | null) => {
  if (!address) return ''
  return `${address.slice(0, 4)}.....${address.slice(-4)}`
}

const WalletButton: React.FC = () => {
  const { walletAddress, setWalletAddress } = useWallet()

  const connectMetaMask = async (): Promise<void> => {
    if (window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({
          method: 'eth_requestAccounts'
        })) as string[]
        const address = accounts[0]
        setWalletAddress(address)
      } catch (error) {
        console.error('Error connecting to MetaMask:', error)
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.')
    }
  }

  const disconnectMetaMask = (): void => {
    setWalletAddress(null)
  }

  return (
    <div>
      {walletAddress ? (
        <div onClick={disconnectMetaMask}>{formatAddress(walletAddress)}</div>
      ) : (
        <div onClick={connectMetaMask}>Connect Wallet</div>
      )}
    </div>
  )
}

export default WalletButton
