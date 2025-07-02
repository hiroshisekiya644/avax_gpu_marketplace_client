import type React from 'react'
import { Suspense } from 'react'
import { Theme } from '@radix-ui/themes'
import { Inter } from 'next/font/google'
import { Poppins } from 'next/font/google'
import '../styles/globals.css'
import '@radix-ui/themes/styles.css'
import { Toaster } from 'react-hot-toast'
import { UserProvider } from '@/context/UserContext'
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
      <body className={`${inter.className} ${poppins.variable} antialiased`}>
        <Theme appearance="dark" accentColor="cyan" grayColor="slate" scaling="100%" radius="medium">
          <UserProvider>
            <Suspense>{children}</Suspense>
          </UserProvider>
          <Toaster />
        </Theme>
      </body>
    </html>
  )
}
