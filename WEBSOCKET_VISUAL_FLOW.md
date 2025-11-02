# WebSocket Real-Time Notifications - Visual Flow

## 🔄 Complete Message Flow (Frontend Integrated)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EMPLOYER BROWSER (Window 1)                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ DashboardPage.jsx                                              │ │
│  │ • useWebSocketNotifications() hook active                      │ │
│  │ • Status: 🟢 Live updates active                               │ │
│  │ • Subscribed to: ['jobs', 'payments']                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  User Action: Click "Create New Job" → Fill Form → Submit            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ POST /jobs                                                      │ │
│  │ {                                                               │ │
│  │   title: "Frontend Developer",                                 │ │
│  │   pay_amount_usd: 5000,                                        │ │
│  │   job_type: "development"                                      │ │
│  │ }                                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   JOB SERVICE (Backend)                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 1. Create job in PostgreSQL database                           │ │
│  │ 2. Lock funds in smart contract (Ganache)                      │ │
│  │ 3. Broadcast to WebSocket Server:                              │ │
│  │                                                                 │ │
│  │    POST http://websocket-server:8000/broadcast                 │ │
│  │    {                                                            │ │
│  │      "type": "job_created",                                    │ │
│  │      "data": {                                                  │ │
│  │        "job_id": 123,                                           │ │
│  │        "title": "Frontend Developer",                           │ │
│  │        "pay_amount_usd": 5000,                                 │ │
│  │        "job_type": "development"                                │ │
│  │      }                                                           │ │
│  │    }                                                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│              WEBSOCKET SERVER (Port 8080)                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ConnectionManager                                               │ │
│  │ • Active Connections: 2                                         │ │
│  │   - employer_connection_id (alice)                              │ │
│  │   - worker_connection_id (bob)                                  │ │
│  │                                                                 │ │
│  │ broadcast_to_all():                                             │ │
│  │   for each connection:                                          │ │
│  │     ws.send(JSON.stringify(message))                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────┬──────────────────────────────────────────────────────┬────────┘
      │                                                      │
      ↓                                                      ↓
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│  EMPLOYER BROWSER (Window 1)     │    │  WORKER BROWSER (Window 2)       │
│  ┌────────────────────────────┐  │    │  ┌────────────────────────────┐  │
│  │ WebSocketContext           │  │    │  │ BrowseJobsPage.jsx         │  │
│  │ ws.onmessage(event)        │  │    │  │ • useWebSocketNotifications│  │
│  │ ↓                          │  │    │  │ • Status: 🟢 Live          │  │
│  │ Parse JSON                 │  │    │  └────────────────────────────┘  │
│  │ ↓                          │  │    │                                  │
│  │ Call handlers for          │  │    │  ┌────────────────────────────┐  │
│  │ message.type = "job_created"│ │    │  │ useWebSocketNotifications  │  │
│  │ ↓                          │  │    │  │                            │  │
│  │ useWebSocketNotifications  │  │    │  │ on('job_created', (data) => │ │
│  │ hook receives event        │  │    │  │   toast.success(...)       │  │
│  └────────────────────────────┘  │    │  │   invalidateQueries()      │  │
│                                  │    │  │ )                          │  │
│  ❌ No toast (is employer)       │    │  └────────────────────────────┘  │
│  ✅ Invalidates ['jobs'] cache   │    │                                  │
│                                  │    │  ┌────────────────────────────┐  │
└──────────────────────────────────┘    │  │ 💼 TOAST APPEARS!          │  │
                                        │  │                            │  │
                                        │  │ New Job Posted!            │  │
                                        │  │ Frontend Developer         │  │
                                        │  │ $5,000 • development       │  │
                                        │  │                            │  │
                                        │  │ [5 second duration]        │  │
                                        │  └────────────────────────────┘  │
                                        │                                  │
                                        │  ✅ Job list auto-refreshes      │
                                        │  ✅ New job appears without      │
                                        │     page reload                  │
                                        └──────────────────────────────────┘
```

---

## 🎯 All 4 Event Flows

### 1. Job Created (💼)
**Trigger**: Employer creates job  
**Broadcast**: All users  
**Toast Recipient**: Workers only  
**Icon**: 💼  
**Auto-refresh**: Job lists, stats  

### 2. Job Accepted (🎉)
**Trigger**: Worker accepts job  
**Broadcast**: All users  
**Toast Recipient**: Employer only  
**Icon**: 🎉  
**Auto-refresh**: Job details, my-jobs, stats  

### 3. Job Completed (🎊 / 💰)
**Trigger**: Worker submits completion  
**Broadcast**: All users  
**Toast Recipient**: Both  
- **Employer**: 🎊 "Job Completed!"  
- **Worker**: 💰 "Payment Released!"  
**Auto-refresh**: Job details, my-jobs, stats, wallet  

### 4. Job Refunded (🔄)
**Trigger**: Job expires / cancelled  
**Broadcast**: All users  
**Toast Recipient**: Employer only  
**Icon**: 🔄  
**Auto-refresh**: Job details, my-jobs, stats, wallet  

---

## 🏗️ Architecture Components

### Frontend (`frontend/src/`)
```
hooks/
  └── useWebSocketNotifications.js  ← 🆕 Central notification handler
        • Subscribes to channels
        • Registers event handlers
        • Shows toast notifications
        • Invalidates React Query cache

contexts/
  └── WebSocketContext.jsx
        • Manages WebSocket connection
        • Auto-reconnection logic
        • Message routing

pages/
  ├── DashboardPage.jsx        ← 🆕 Uses hook + shows status
  ├── BrowseJobsPage.jsx       ← 🆕 Uses hook + shows status  
  └── JobDetailsPage.jsx       ← 🆕 Simplified (uses global hook)
```

### Backend (`backend/`)
```
websocket_server/
  ├── main.py                  ← WebSocket server
  │    • ws://localhost:8080/ws (client connection)
  │    • POST /broadcast (backend endpoint)
  └── connection_manager.py    ← Connection tracking

job_service/main.py           ← Broadcasts job events
  • Line ~221: job_refunded
  • Line ~333: job_created
  • Line ~701: job_accepted
  • Line ~840: job_completed
```

---

## 📊 React Query Cache Invalidation

```javascript
// When 'job_created' event received:
queryClient.invalidateQueries({ queryKey: ['jobs'] })
queryClient.invalidateQueries({ queryKey: ['stats'] })
↓
React Query automatically refetches if components are using these queries
↓
UI updates without page reload
```

**Cache Keys Invalidated:**
- `['jobs']` - All jobs list (BrowseJobsPage)
- `['job', id]` - Specific job details (JobDetailsPage)
- `['my-jobs']` - User's jobs (DashboardPage)
- `['stats']` - Platform statistics
- `['wallet-balance']` - Wallet balance display

---

## 🎨 Toast Notification Styling

```jsx
toast.success(
  <div>
    <div className="font-semibold">New Job Posted!</div>
    <div className="text-sm">Frontend Developer</div>
    <div className="text-xs text-gray-500 mt-1">
      $5,000 • development
    </div>
  </div>,
  {
    duration: 5000,
    icon: '💼',
  }
)
```

**Features:**
- Multi-line content
- Custom icons
- Styled with Tailwind CSS
- Auto-dismiss after duration
- Positioned top-right
- Stacked if multiple

---

## 🔌 Connection Status Indicators

### Dashboard
```jsx
{isConnected ? (
  <>
    <Wifi size={14} className="text-green-600" />
    <span className="text-green-600">Live updates active</span>
  </>
) : (
  <>
    <WifiOff size={14} className="text-gray-400" />
    <span className="text-gray-400">Offline</span>
  </>
)}
```

### Browse Jobs
```jsx
{isConnected ? (
  <>
    <Wifi size={16} className="text-green-600" />
    <span className="text-green-600">Live</span>
  </>
) : (
  <>
    <WifiOff size={16} className="text-gray-400" />
    <span className="text-gray-400">Offline</span>
  </>
)}
```

---

## 🚀 Quick Start

### Enable Notifications in Any Component

```jsx
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications'

function MyComponent() {
  // That's it! Notifications are now active
  const { isConnected } = useWebSocketNotifications()
  
  return (
    <div>
      Status: {isConnected ? '🟢 Connected' : '🔴 Offline'}
    </div>
  )
}
```

**The hook automatically:**
- ✅ Subscribes to channels
- ✅ Handles all 4 event types
- ✅ Shows appropriate toasts
- ✅ Refreshes data
- ✅ Cleans up on unmount

---

## ✅ Implementation Checklist

- [x] Create `useWebSocketNotifications` hook
- [x] Add to DashboardPage
- [x] Add to BrowseJobsPage
- [x] Simplify JobDetailsPage
- [x] Add connection status indicators
- [x] Test job_created event
- [x] Test job_accepted event
- [x] Test job_completed event
- [x] Test job_refunded event
- [x] Update documentation

**Status**: ✅ **COMPLETE AND READY FOR USE**

---

**Last Updated**: November 1, 2025  
**Version**: 1.0.0
