import { io, type Socket } from 'socket.io-client'

// Create a singleton socket instance
let socket: Socket | null = null

export const initializeSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8081'

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    // Log connection events for debugging
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })
  }

  return socket
}

export const joinUserRoom = (userId: string | number): void => {
  const socketInstance = initializeSocket()
  if (socketInstance && userId) {
    console.log('Joining room for user:', userId)
    socketInstance.emit('join-room', userId)
  }
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

const socketService = {
  initializeSocket,
  joinUserRoom,
  disconnectSocket
}

export default socketService
