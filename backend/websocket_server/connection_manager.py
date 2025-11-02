from fastapi import WebSocket
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # User mapping: {user_id: connection_id}
        self.user_connections: Dict[int, str] = {}
        # Subscriptions: {channel: set of connection_ids}
        self.subscriptions: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: int = None):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        if user_id:
            self.user_connections[user_id] = connection_id
        logger.info(f"✅ WebSocket connected: {connection_id}" + (f" (user {user_id})" if user_id else ""))
    
    def disconnect(self, connection_id: str):
        """Remove WebSocket connection"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        # Remove from user mapping
        user_id_to_remove = None
        for user_id, conn_id in self.user_connections.items():
            if conn_id == connection_id:
                user_id_to_remove = user_id
                break
        if user_id_to_remove:
            del self.user_connections[user_id_to_remove]
        
        # Remove from all subscriptions
        for channel in self.subscriptions:
            self.subscriptions[channel].discard(connection_id)
        
        logger.info(f"❌ WebSocket disconnected: {connection_id}")
    
    def subscribe(self, connection_id: str, channels: list):
        """Subscribe connection to channels"""
        for channel in channels:
            if channel not in self.subscriptions:
                self.subscriptions[channel] = set()
            
            # Only log if this is a new subscription
            if connection_id not in self.subscriptions[channel]:
                self.subscriptions[channel].add(connection_id)
                logger.info(f"📡 {connection_id} subscribed to {channel}")
            # else: Already subscribed, silently ignore
    
    def unsubscribe(self, connection_id: str, channels: list):
        """Unsubscribe connection from channels"""
        for channel in channels:
            if channel in self.subscriptions:
                self.subscriptions[channel].discard(connection_id)
                logger.info(f"🔇 {connection_id} unsubscribed from {channel}")
    
    async def send_personal_message(self, message: dict, connection_id: str):
        """Send message to specific connection"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def broadcast_to_channel(self, message: dict, channel: str):
        """Broadcast message to all subscribers of a channel"""
        if channel not in self.subscriptions:
            return
        
        disconnected = []
        for connection_id in self.subscriptions[channel]:
            if connection_id in self.active_connections:
                websocket = self.active_connections[connection_id]
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to broadcast to {connection_id}: {e}")
                    disconnected.append(connection_id)
        
        # Clean up disconnected clients
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected.append(connection_id)
        
        # Clean up disconnected clients
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    async def send_to_user(self, message: dict, user_id: int):
        """Send message to a specific user by user ID"""
        if user_id in self.user_connections:
            connection_id = self.user_connections[user_id]
            await self.send_personal_message(message, connection_id)
        else:
            logger.warning(f"User {user_id} not connected")
    
    def get_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "total_channels": len(self.subscriptions),
            "subscriptions_by_channel": {
                channel: len(subs) for channel, subs in self.subscriptions.items()
            }
        }
