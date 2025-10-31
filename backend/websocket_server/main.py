from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime
import uuid
import os
import logging

from connection_manager import ConnectionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PayChain WebSocket Server", version="1.0.0")

# Connection manager
manager = ConnectionManager()

CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

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


@app.on_event("startup")
async def startup():
    logger.info("✅ WebSocket Server started")


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
async def broadcast_message(message: BroadcastMessage):
    """Broadcast message to connected clients (called by other services)"""
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


@app.get("/stats")
async def get_stats():
    """Get WebSocket server statistics"""
    return manager.get_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
