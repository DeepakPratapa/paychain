# 🔌 WebSocket Real-Time Communication Documentation

## Overview

PayChain uses **WebSocket technology** for real-time, bidirectional communication between the backend services and frontend clients. This enables instant notifications and live updates without polling.

---

## 🎯 Use Cases

### ✅ Fully Implemented with Frontend Integration:
1. **Job Created** ✅ - All users see toast notification when new job is posted
2. **Job Accepted** ✅ - Employer receives toast when worker accepts job
3. **Job Completed** ✅ - Both employer and worker receive payment notifications
4. **Job Refunded** ✅ - Employer notified when expired job funds are returned

**Features:**
- 🎨 Beautiful toast notifications with icons (💼 🎉 🎊 💰 🔄)
- 🔄 Automatic data refresh (React Query cache invalidation)
- 👥 User-type aware messages (employer vs worker)
- 📊 Live connection status indicators
- 🔌 Auto-reconnection with exponential backoff

### Future Use Cases:
- Live job status updates
- Real-time chat between employer and worker
- Payment confirmation notifications
- Platform-wide announcements
- User presence indicators (online/offline)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────┘

Frontend (React)
    │
    │ WebSocket Connection
    │ ws://localhost:8080/ws
    ↓
WebSocket Server (Port 8080)
    │
    ├─ Connection Manager
    │  ├─ Active Connections Map
    │  ├─ Channel Subscriptions
    │  └─ Message Routing
    │
    ↑ HTTP POST /broadcast
    │
Backend Microservices
    ├─ Job Service (job events)
    ├─ Payment Service (payment events)
    └─ User Service (auth events)
```

---

## 📡 WebSocket Server

**Location**: `backend/websocket_server/main.py`

### Endpoints

#### 1. WebSocket Connection: `ws://localhost:8080/ws`

**Client connects and receives welcome message**:
```json
{
  "type": "connected",
  "data": {
    "connection_id": "uuid-here"
  },
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

#### 2. HTTP Broadcast: `POST /broadcast`

**Used by backend services to send messages to clients**:
```json
{
  "type": "job_created",
  "data": {
    "job_id": 123,
    "title": "Full Stack Developer",
    "pay_amount_usd": 5000
  },
  "channel": "jobs" // optional
}
```

#### 3. Health Check: `GET /health`

Returns WebSocket server stats:
```json
{
  "status": "healthy",
  "service": "websocket-server",
  "connections": {
    "total": 5,
    "by_channel": {
      "jobs": 3,
      "payments": 2
    }
  }
}
```

---

## 🔄 Message Flow

### Example: Job Creation Flow

```
1. Employer creates job (Frontend POST /jobs)
   │
   ↓
2. Job Service creates job in DB
   │
   ↓
3. Job Service calls WebSocket Server
   POST http://websocket-server:8000/broadcast
   {
     "type": "job_created",
     "data": { job details }
   }
   │
   ↓
4. WebSocket Server broadcasts to all connected clients
   │
   ↓
5. Workers' browsers receive instant notification
   {
     "type": "job_created",
     "data": { job details },
     "timestamp": "..."
   }
   │
   ↓
6. Frontend updates job list in real-time
```

---

## 💻 Frontend Implementation

**Location**: `frontend/src/contexts/WebSocketContext.jsx`

### Usage in Components

```jsx
import { useWebSocket } from '../contexts/WebSocketContext'

function JobList() {
  const { isConnected, on, subscribe } = useWebSocket()

  useEffect(() => {
    // Subscribe to job-related events
    subscribe('jobs')

    // Listen for new jobs
    const unsubscribe = on('job_created', (data) => {
      console.log('New job posted!', data)
      toast.success(`New job: ${data.title}`)
      // Refresh job list or add to state
    })

    return () => unsubscribe()
  }, [])

  return (
    <div>
      <div>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      {/* Job list */}
    </div>
  )
}
```

### Available Methods

#### `isConnected` (boolean)
WebSocket connection status

#### `subscribe(channels)`
Subscribe to specific channels
```javascript
subscribe(['jobs', 'payments'])
```

#### `unsubscribe(channels)`
Unsubscribe from channels
```javascript
unsubscribe(['jobs'])
```

#### `on(messageType, handler)`
Register message handler
```javascript
const unsubscribe = on('job_accepted', (data) => {
  console.log('Job accepted:', data)
})
// Clean up
unsubscribe()
```

#### `send(type, data)`
Send message to server
```javascript
send('ping')
```

---

## 🔔 Message Types

### Job Events

#### `job_created`
```json
{
  "type": "job_created",
  "data": {
    "job_id": 123,
    "title": "Web Development",
    "pay_amount_usd": 5000,
    "job_type": "development"
  },
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

#### `job_accepted`
```json
{
  "type": "job_accepted",
  "data": {
    "job_id": 123,
    "worker_id": 456
  },
  "timestamp": "2025-11-01T12:30:00.000Z"
}
```

#### `job_completed`
```json
{
  "type": "job_completed",
  "data": {
    "job_id": 123,
    "payment_released": true
  },
  "timestamp": "2025-11-01T15:00:00.000Z"
}
```

#### `job_refunded`
```json
{
  "type": "job_refunded",
  "data": {
    "job_id": 123,
    "reason": "expired"
  },
  "timestamp": "2025-11-01T16:00:00.000Z"
}
```

### System Events

#### `connected`
Welcome message when client connects

#### `pong`
Response to ping (keepalive)

#### `subscribed` / `unsubscribed`
Confirmation of channel subscription changes

---

## 🛠️ Backend Integration

### Example: Broadcasting from Job Service

```python
# backend/job_service/main.py

import httpx

# After creating a job
async with httpx.AsyncClient() as client:
    await client.post(
        f"{settings.WS_SERVICE_URL}/broadcast",
        json={
            "type": "job_created",
            "data": {
                "job_id": new_job.id,
                "title": new_job.title,
                "pay_amount_usd": float(new_job.pay_amount_usd),
                "job_type": new_job.job_type
            }
        },
        timeout=5.0
    )
```

### Broadcast Locations

#### Job Service (`job_service/main.py`)
- Line ~333: Job created broadcast
- Line ~701: Job accepted broadcast
- Line ~840: Job completed broadcast
- Line ~221: Job refunded broadcast

#### Payment Service
- Could broadcast payment confirmations (not yet implemented)

#### User Service
- Could broadcast auth events (not yet implemented)

---

## 🔐 Security Considerations

### Current Implementation
- ✅ CORS configured for allowed origins
- ✅ Connection IDs generated (UUID)
- ⚠️ No authentication on WebSocket connections

### Recommended Improvements

#### 1. WebSocket Authentication
```javascript
// Frontend: Send JWT token on connect
const ws = new WebSocket(`${wsUrl}/ws?token=${accessToken}`)

// Backend: Verify token
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    # Verify JWT token
    user = verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    # Connect with user context
    await manager.connect(websocket, connection_id, user_id=user.id)
```

#### 2. Channel-Based Authorization
```python
# Only allow users to subscribe to channels they have access to
if channel == "payments" and user.user_type != "employer":
    raise HTTPException(403, "Not authorized for this channel")
```

#### 3. Rate Limiting
```python
# Limit messages per connection
if manager.get_message_count(connection_id) > 100:
    await websocket.close(code=4008, reason="Rate limit exceeded")
```

---

## 📊 Connection Manager

**Location**: `backend/websocket_server/connection_manager.py`

### Features
- **Active Connections**: Tracks all connected WebSocket clients
- **Channel Subscriptions**: Manages topic-based subscriptions
- **Broadcast Methods**:
  - `broadcast_to_all()` - Send to everyone
  - `broadcast_to_channel()` - Send to channel subscribers
  - `send_to_connection()` - Send to specific connection

### Statistics
```python
manager.get_stats()
# Returns:
{
  "total": 5,
  "by_channel": {
    "jobs": 3,
    "payments": 2
  }
}
```

---

## 🧪 Testing WebSockets

### Browser Console Test

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws')

// Listen for messages
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data))
}

// Subscribe to jobs channel
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['jobs']
}))

// Send ping
ws.send(JSON.stringify({ type: 'ping' }))
```

### Backend Test (curl)

```bash
# Trigger a broadcast
curl -X POST http://localhost:8080/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test_message",
    "data": {"message": "Hello WebSocket!"},
    "channel": "jobs"
  }'
```

### Check WebSocket Stats

```bash
curl http://localhost:8080/stats | jq .
```

---

## 🚀 Auto-Reconnection

The frontend automatically reconnects with exponential backoff:

```
Attempt 1: Reconnect after 1 second
Attempt 2: Reconnect after 2 seconds
Attempt 3: Reconnect after 4 seconds
Attempt 4: Reconnect after 8 seconds
Attempt 5: Reconnect after 16 seconds
Max: 30 seconds delay, 5 max attempts
```

After successful reconnection:
- ✅ Automatically resubscribes to previous channels
- ✅ Resumes message handling

---

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
WS_SERVICE_URL=http://websocket-server:8000
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Frontend (.env)
VITE_WS_URL=ws://localhost:8080
```

### Docker Compose

```yaml
websocket-server:
  ports:
    - "8080:8000"  # WebSocket port exposed
  networks:
    - backend-net  # Can receive broadcasts from services
```

---

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:8080/health
```

### Logs
```bash
docker logs paychain-websocket --tail 50 -f
```

### Example Log Output
```
✅ WebSocket Server started
📨 Client abc123 connected
📢 Broadcasted 'job_created' to all clients
🔌 Client abc123 disconnected
```

---

## 🎯 Future Enhancements

### Phase 1 (Next Sprint)
- [ ] JWT authentication for WebSocket connections
- [ ] User-specific channels (private messages)
- [ ] Message persistence (store last N messages)
- [ ] Reconnection token rotation

### Phase 2 (Next Month)
- [ ] Real-time chat between employer/worker
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Online/offline presence

### Phase 3 (Future)
- [ ] WebSocket clustering (Redis PubSub)
- [ ] Message encryption
- [ ] Horizontal scaling
- [ ] Analytics dashboard

---

## 🐛 Troubleshooting

### WebSocket Won't Connect

**Check 1**: Verify server is running
```bash
curl http://localhost:8080/health
```

**Check 2**: Check browser console for errors
```
❌ WebSocket connection to 'ws://localhost:8080/ws' failed
```

**Check 3**: Verify CORS configuration
```python
# nginx/nginx.conf
location /ws {
    proxy_pass http://websocket:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Messages Not Received

**Check 1**: Verify subscription
```javascript
// Make sure you subscribed
subscribe(['jobs'])
```

**Check 2**: Check backend is broadcasting
```bash
docker logs paychain-job-service | grep broadcast
```

**Check 3**: Verify handler is registered
```javascript
on('job_created', (data) => {
  console.log('Handler called:', data)
})
```

---

## 📚 Additional Resources

- **WebSocket MDN**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **FastAPI WebSockets**: https://fastapi.tiangolo.com/advanced/websockets/
- **Socket.IO Alternative**: For more features (rooms, namespaces, acknowledgments)

---

**Last Updated**: November 1, 2025  
**Version**: 1.0.0
