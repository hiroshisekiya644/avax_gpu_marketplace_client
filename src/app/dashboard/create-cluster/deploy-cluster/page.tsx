'use client'

import { useEffect } from 'react'
import { Flex, Text } from '@radix-ui/themes'
import { io } from 'socket.io-client'
import styles from './page.module.css'

/**
 * DeployCluster Component
 *
 * Minimal implementation that just connects to Socket.IO and logs events to console.
 */
const DeployCluster = () => {
  useEffect(() => {
    console.log('Initializing socket connection...')

    // Initialize Socket.IO connection
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    // Socket event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    // Listen for GPU status updates
    socket.on('gpu-status-update', (data) => {
      console.log('Received GPU status update:', data)
    })

    // Clean up on unmount
    return () => {
      console.log('Cleaning up socket connection')
      socket.disconnect()
    }
  }, [])

  return (
    <Flex className={styles.container} direction="column" align="center" justify="center">
      <Text size="6" weight="bold">
        This is deploy-cluster page
      </Text>
      <Text size="3" style={{ marginTop: '1rem' }}>
        Socket.IO is connected. Check the browser console (F12) for logs.
      </Text>
    </Flex>
  )
}

export default DeployCluster
