import type React from 'react'
import { Suspense } from 'react'
import { Theme } from '@radix-ui/themes'
// Replace the IBM Plex Sans import with Inter font which better matches the design
import { Inter } from 'next/font/google'
// Import Poppins as a secondary font for headings
import { Poppins } from 'next/font/google'
import '../styles/globals.css'
// Important: Import Radix UI styles AFTER globals.css but BEFORE any component styles
import '@radix-ui/themes/styles.css'
import { Toaster } from 'react-hot-toast'
import { BalanceProvider } from '@/context/BalanceContext'
import { UserProvider } from '@/context/UserContext'
import { GpuInstanceProvider } from '@/context/GpuInstanceContext'
import type { Metadata } from 'next'

// Configure the Inter font
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

// Configure the Poppins font for headings
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'AVAX GPU Marketplace',
  description: 'AVAX GPU Marketplace'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.variable} antialiased`}>
        <Theme appearance="dark" accentColor="cyan" grayColor="slate" scaling="100%" radius="medium">
          <UserProvider>
            <BalanceProvider>
              <GpuInstanceProvider>
                <Suspense>{children}</Suspense>
              </GpuInstanceProvider>
            </BalanceProvider>
          </UserProvider>
          <Toaster />
        </Theme>
      </body>
    </html>
  )
}
