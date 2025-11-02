from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime
import uuid
import os
import logging

from connection_manager import ConnectionManager

# Import centralized auth guard for service-to-service authentication
import sys
sys.path.insert(0, '/app')
from shared.auth_guard import verify_service_key

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PayChain WebSocket Server", version="1.0.0")

# Connection manager
manager = ConnectionManager()

CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
# WS_SERVICE_API_KEY now managed by Central Auth Guard

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BroadcastMessage(BaseModel):
    type: str
    data: Optional[Any] = None
    channel: Optional[str] = None


class NotifyMessage(BaseModel):
    user_id: int
    type: str
    data: Optional[Any] = None


@app.on_event("startup")
async def startup():
    logger.info("✅ WebSocket Server started with Central Auth Guard")


# Service API key verification now handled by Central Auth Guard
# No need for custom verify_service_key function


@app.get("/health")
async def health_check():
    stats = manager.get_stats()
    return {
        "status": "healthy",
        "service": "websocket-server",
        "connections": stats
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection endpoint"""
    connection_id = str(uuid.uuid4())
    user_id = None
    
    await manager.connect(websocket, connection_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "data": {"connection_id": connection_id},
            "timestamp": datetime.utcnow().isoformat()
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "ping":
                # Respond to ping
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "authenticate":
                # Associate user with connection
                user_id = data.get("user_id")
                if user_id:
                    manager.user_connections[user_id] = connection_id
                    logger.info(f"User {user_id} authenticated on connection {connection_id}")
                    await websocket.send_json({
                        "type": "authenticated",
                        "data": {"user_id": user_id},
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            elif message_type == "subscribe":
                # Subscribe to channels
                channels = data.get("channels", [])
                manager.subscribe(connection_id, channels)
                await websocket.send_json({
                    "type": "subscribed",
                    "data": {"channels": channels},
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "unsubscribe":
                # Unsubscribe from channels
                channels = data.get("channels", [])
                manager.unsubscribe(connection_id, channels)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "data": {"channels": channels},
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            else:
                # Unknown message type
                await websocket.send_json({
                    "type": "error",
                    "error": {"code": "UNKNOWN_TYPE", "message": f"Unknown message type: {message_type}"},
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id)
        logger.info(f"Client {connection_id} disconnected")
    
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
        manager.disconnect(connection_id)


@app.post("/broadcast")
async def broadcast_message(
    message: BroadcastMessage,
    api_key: bool = Depends(verify_service_key)
):
    """Broadcast message to connected clients (service-to-service - requires API key via Central Auth Guard)"""
    try:
        payload = {
            "type": message.type,
            "data": message.data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if message.channel:
            # Broadcast to specific channel
            await manager.broadcast_to_channel(payload, message.channel)
            logger.info(f"Broadcasted '{message.type}' to channel '{message.channel}'")
        else:
            # Broadcast to all
            await manager.broadcast_to_all(payload)
            logger.info(f"Broadcasted '{message.type}' to all clients")
        
        return {"status": "broadcasted", "type": message.type}
        
    except Exception as e:
        logger.error(f"Broadcast failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Broadcast failed"
        )


@app.post("/notify")
async def notify_user(
    message: NotifyMessage,
    api_key: bool = Depends(verify_service_key)
):
    """Send notification to a specific user (service-to-service - requires API key via Central Auth Guard)"""
    try:
        payload = {
            "type": message.type,
            "data": message.data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to specific user
        await manager.send_to_user(payload, message.user_id)
        logger.info(f"Notified user {message.user_id} with '{message.type}'")
        
        return {"status": "notified", "user_id": message.user_id, "type": message.type}
        
    except Exception as e:
        logger.error(f"Notify failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Notify failed"
        )


@app.get("/stats")
async def get_stats():
    """Get WebSocket server statistics"""
    return manager.get_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
