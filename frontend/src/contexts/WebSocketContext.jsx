import { createContext, useContext, useEffect, useRef, useState } from 'react'
import config from '../config'

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
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const subscribedChannels = useRef(new Set())
  const messageHandlers = useRef(new Map())

  // WebSocket URL (remove http:// or https:// and replace with ws://)
  const getWebSocketUrl = () => {
    const wsUrl = config.WS_URL || 'ws://localhost:8080'
    return `${wsUrl}/ws`
  }

  const connect = () => {
    try {
      const ws = new WebSocket(getWebSocketUrl())

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0

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
          console.log('📨 WebSocket message:', message)
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

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`🔄 Reconnecting in ${delay}ms... (Attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.error('❌ Max reconnection attempts reached')
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
    
    channelArray.forEach((channel) => subscribedChannels.current.add(channel))

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          channels: channelArray,
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
    messageHandlers.current.get(messageType).add(handler)

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

  // Connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [])

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
