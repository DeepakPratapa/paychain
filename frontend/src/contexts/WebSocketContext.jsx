import { createContext, useContext, useEffect, useRef, useState } from 'react'
import config from '../config'
import { useAuth } from './AuthContext'

const WebSocketContext = createContext(null)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const { user } = useAuth()
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const subscribedChannels = useRef(new Set())
  const messageHandlers = useRef(new Map())
  const isCleaningUpRef = useRef(false)
  const authenticatedRef = useRef(false)

  // WebSocket URL (remove http:// or https:// and replace with ws://)
  const getWebSocketUrl = () => {
    const wsUrl = config.WS_URL || 'ws://localhost:8080'
    return `${wsUrl}/ws`
  }

  const connect = () => {
    try {
      const ws = new WebSocket(getWebSocketUrl())

      ws.onopen = () => {
        setIsConnected(true)
        reconnectAttempts.current = 0
        authenticatedRef.current = false

        // Authenticate with user ID if logged in
        if (user?.id) {
          ws.send(
            JSON.stringify({
              type: 'authenticate',
              user_id: user.id,
            })
          )
          authenticatedRef.current = true
        }

        // Resubscribe to channels after reconnection
        if (subscribedChannels.current.size > 0) {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              channels: Array.from(subscribedChannels.current),
            })
          )
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          setLastMessage(message)

          // Call registered handlers for this message type
          const handlers = messageHandlers.current.get(message.type)
          if (handlers) {
            handlers.forEach((handler) => handler(message.data))
          }

          // Call handlers for 'all' messages
          const allHandlers = messageHandlers.current.get('*')
          if (allHandlers) {
            allHandlers.forEach((handler) => handler(message))
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = () => {
        // Silently ignore WebSocket errors during cleanup (React.StrictMode)
        // Real connection errors will be handled by reconnect logic
      }

      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null

        // Don't reconnect if we're cleaning up (component unmounting)
        if (isCleaningUpRef.current) {
          return
        }

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  const subscribe = (channels) => {
    const channelArray = Array.isArray(channels) ? channels : [channels]
    
    // Only add new channels that aren't already subscribed
    const newChannels = channelArray.filter(channel => !subscribedChannels.current.has(channel))
    
    if (newChannels.length === 0) {
      return // Already subscribed to all requested channels
    }
    
    newChannels.forEach((channel) => subscribedChannels.current.add(channel))

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          channels: newChannels,
        })
      )
    }
  }

  const unsubscribe = (channels) => {
    const channelArray = Array.isArray(channels) ? channels : [channels]
    
    channelArray.forEach((channel) => subscribedChannels.current.delete(channel))

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'unsubscribe',
          channels: channelArray,
        })
      )
    }
  }

  const on = (messageType, handler) => {
    if (!messageHandlers.current.has(messageType)) {
      messageHandlers.current.set(messageType, new Set())
    }
    
    const handlers = messageHandlers.current.get(messageType)
    
    // Check if this exact handler is already registered
    if (handlers.has(handler)) {
      return () => {} // Return no-op unsubscribe
    }
    
    handlers.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = messageHandlers.current.get(messageType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          messageHandlers.current.delete(messageType)
        }
      }
    }
  }

  const send = (type, data = null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }))
    } else {
      console.warn('WebSocket is not connected. Message not sent:', type, data)
    }
  }

  // Connect on mount and when user changes
  useEffect(() => {
    isCleaningUpRef.current = false
    connect()

    return () => {
      isCleaningUpRef.current = true
      disconnect()
    }
  }, [user?.id]) // Reconnect when user changes

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const pingInterval = setInterval(() => {
      send('ping')
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(pingInterval)
  }, [isConnected])

  const value = {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    on,
    send,
    connect,
    disconnect,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
