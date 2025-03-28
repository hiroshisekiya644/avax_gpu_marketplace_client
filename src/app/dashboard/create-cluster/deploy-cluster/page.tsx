'use client'

import { useEffect, useRef, useState } from 'react'
import { Flex, Text } from '@radix-ui/themes'
import { io, Socket } from 'socket.io-client'
import styles from './page.module.css'

interface GPUStatus {
  instance_id: number
  status: string
  vm_state: string | null
}

const DeployCluster = () => {
  const [gpuStatus, setGpuStatus] = useState<GPUStatus | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    console.log('Initializing socket connection...')

    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8081', {
      withCredentials: true,
      transports: ['websocket']
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id)
    })

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socketRef.current.on('gpu-status-update', (data: GPUStatus) => {
      console.log('Received GPU status update:', data)
      setGpuStatus(data)
    })

    return () => {
      console.log('Cleaning up socket connection...')
      socketRef.current?.disconnect()
    }
  }, [])

  return (
    <Flex className={styles.container} direction="column" align="center" justify="center">
      <Text size="6" weight="bold">
        This is deploy-cluster page
      </Text>

      <Text size="3" style={{ marginTop: '1rem' }}>
        Socket.IO is connected. Check the browser console (F12) for real-time updates.
      </Text>

      {gpuStatus && (
        <Flex direction="column" align="center" mt="4">
          <Text size="4" weight="medium">
            Instance ID: {gpuStatus.instance_id}
          </Text>
          <Text size="4" color="green">
            Status: {gpuStatus.status}
          </Text>
          {gpuStatus.vm_state && (
            <Text size="4" color="gray">
              VM State: {gpuStatus.vm_state}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}

export default DeployCluster
