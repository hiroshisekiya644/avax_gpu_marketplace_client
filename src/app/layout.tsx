import type React from 'react'
import { Suspense } from 'react'
import { Theme } from '@radix-ui/themes'
import { IBM_Plex_Sans } from 'next/font/google'
import '../styles/globals.css'
// Important: Import Radix UI styles AFTER globals.css but BEFORE any component styles
import '@radix-ui/themes/styles.css'
import { Toaster } from 'react-hot-toast'
import { BalanceProvider } from '@/context/BalanceContext'
import { WalletProvider } from '@/context/Web3Context'
import type { Metadata } from 'next'

const ibm_plex_sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'rLoop GPU Marketplace',
  description: 'rLoop GPU Marketplace'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ibm_plex_sans.className} antialiased`}>
        <Theme appearance="dark" accentColor="purple" grayColor="slate" scaling="100%" radius="medium">
          <WalletProvider>
            <BalanceProvider>
              <Suspense>{children}</Suspense>
            </BalanceProvider>
          </WalletProvider>
          <Toaster />
        </Theme>
      </body>
    </html>
  )
}
