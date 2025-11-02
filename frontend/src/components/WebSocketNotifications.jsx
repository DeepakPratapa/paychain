import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications'

/**
 * Component that handles WebSocket notifications globally
 * This component doesn't render anything - it just activates the notifications hook
 */
const WebSocketNotifications = () => {
  useWebSocketNotifications()
  return null
}

export default WebSocketNotifications
