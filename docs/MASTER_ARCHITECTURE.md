# 🏗️ PayChain - Master Architecture Document

**Version:** 2.0  
**Last Updated:** November 4, 2025  
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Microservices](#microservices)
5. [Authentication & Security](#authentication--security)
6. [Database Architecture](#database-architecture)
7. [Blockchain Integration](#blockchain-integration)
8. [Real-Time Communication](#real-time-communication)
9. [Frontend Architecture](#frontend-architecture)
10. [Data Flow](#data-flow)
11. [Deployment Architecture](#deployment-architecture)
12. [Security Features](#security-features)
13. [API Structure](#api-structure)

---

## System Overview

PayChain is a  blockchain-powered escrow platform for the gig economy. It combines microservices architecture, smart contracts, and real-time communication to create a trustless payment system.

### Core Purpose
Enable secure payments between employers and workers through blockchain escrow, with automated fund release and real-time notifications.

### Key Characteristics
- **Microservices-based**: 6 independent services
- **Event-driven**: WebSocket real-time updates
- **Blockchain-secured**: Smart contract escrow
- **Database-backed**: PostgreSQL with Redis caching
- **Production-ready**: Docker Compose deployment

---

## Technology Stack

### Frontend Layer
```
React 18.2.0
├── State Management
│   ├── React Query (TanStack Query v5) - Server state
│   ├── Context API - Auth, Wallet, WebSocket
│   └── Local State (useState) - UI state
├── UI Framework
│   ├── Tailwind CSS 3.4
│   ├── Lucide React - Icons
│   └── React Hot Toast - Notifications
├── Blockchain
│   ├── ethers.js 6.9 - Ethereum interaction
│   └── MetaMask integration
├── Real-Time
│   └── Socket.io Client 4.6
└── Routing
    └── React Router DOM 6.20
```

### Backend Layer
```
Python 3.11
├── Web Framework
│   └── FastAPI 0.104 (async/await)
├── Database ORM
│   └── SQLAlchemy 2.0 (async)
├── Authentication
│   ├── PyJWT - Token handling
│   └── eth-account - Signature verification
├── HTTP Client
│   └── httpx (async)
├── WebSocket
│   └── python-socketio 5.10
└── Validation
    └── Pydantic 2.5
```

### Infrastructure Layer
```
Docker Compose v2
├── Databases
│   ├── PostgreSQL 16 (Alpine)
│   └── Redis 7 (Alpine)
├── Blockchain
│   └── Ganache (Truffle Suite)
├── Reverse Proxy
│   └── Nginx (Alpine)
└── Smart Contracts
    └── Hardhat + Solidity 0.8.20
```

---

## Architecture Layers

### 1. Presentation Layer
- **React Frontend** (`port 5173`)
- **Nginx Reverse Proxy** (`port 8000`)
- Handles user interaction, UI rendering, MetaMask integration

### 2. API Layer
- **API Gateway** (`port 8001`) - Request routing, CORS
- **Service APIs** - User, Job, Payment, WebSocket
- RESTful endpoints with JWT authentication

### 3. Business Logic Layer
- **Microservices** - Domain-specific logic
- **Auth Guard** - Centralized authentication
- **Service-to-Service Communication** - HTTP with API keys

### 4. Data Layer
- **PostgreSQL** - Persistent storage
- **Redis** - Token blacklist, pub/sub
- **Blockchain** - Smart contract state

### 5. Integration Layer
- **Blockchain Client** - Web3 interactions
- **WebSocket Server** - Real-time events
- **Payment Service** - Blockchain gateway

---

## Microservices

### Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌────────────┐              ┌─────────────┐                │
│  │   React    │──WebSocket──▶│   Browser   │                │
│  │  Frontend  │              │  (MetaMask) │                │
│  └──────┬─────┘              └─────────────┘                │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │ HTTP
┌─────────▼─────────────────────────────────────────────────────┐
│                    GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────┐      │
│  │              Nginx Reverse Proxy                    │      │
│  │         (CORS, Security Headers, SSL)               │      │
│  └───────────────────┬─────────────────────────────────┘      │
└────────────────────┼──────────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────────┐
│                   SERVICE LAYER                                │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     User     │  │     Job      │  │   Payment    │       │
│  │   Service    │  │   Service    │  │   Service    │       │
│  │  (Port 8002) │  │  (Port 8003) │  │  (Port 8004) │       │
│  │              │  │              │  │              │       │
│  │ • Auth       │  │ • CRUD       │  │ • Blockchain │       │
│  │ • JWT        │  │ • Workflow   │  │ • Escrow     │       │
│  │ • Users      │  │ • Checklist  │  │ • Balance    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
│         │                  │                  │               │
│  ┌──────▼──────────────────▼──────────────────▼───────┐      │
│  │            Central Authentication Guard             │      │
│  │         (Shared Auth Module - auth_guard.py)        │      │
│  │                                                      │      │
│  │  • JWT Verification          • User Extraction      │      │
│  │  • Token Blacklist Check     • Role Authorization   │      │
│  │  • Redis Integration         • Dependency Injection │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ┌──────────────┐                                             │
│  │  WebSocket   │                                             │
│  │   Server     │                                             │
│  │  (Port 8080) │                                             │
│  │              │                                             │
│  │ • Socket.io  │                                             │
│  │ • Broadcast  │                                             │
│  │ • Channels   │                                             │
│  └──────┬───────┘                                             │
└─────────┼──────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                    DATA LAYER                                  │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │   Ganache    │       │
│  │  Database    │  │    Cache     │  │  Blockchain  │       │
│  │  (Port 5432) │  │  (Port 6379) │  │  (Port 8545) │       │
│  │              │  │              │  │              │       │
│  │ • Users      │  │ • Blacklist  │  │ • Contracts  │       │
│  │ • Jobs       │  │ • Pub/Sub    │  │ • Accounts   │       │
│  │ • Txns       │  │ • Sessions   │  │ • State      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────────────────────────────────────────────┘
```

### 1. User Service (`backend/user_service/`)

**Responsibility:** Authentication and user management

**Key Features:**
- MetaMask signature-based authentication
- JWT token generation and refresh
- User registration and profile management
- Token blacklisting on logout

**Endpoints:**
```
POST   /auth/nonce/{wallet}     - Get signing nonce
POST   /auth/login              - Verify signature & login
POST   /auth/signup             - Complete registration
POST   /auth/refresh            - Refresh access token
POST   /auth/logout             - Blacklist token
GET    /users/{id}              - Get user profile
PUT    /users/{id}              - Update profile
```

**Technologies:**
- FastAPI with async SQLAlchemy
- PyJWT for token handling
- eth-account for signature verification
- Redis for token blacklist
- Bcrypt for nonce hashing

**Database Tables:**
- `users` - User profiles
- Token blacklist stored in Redis

---

### 2. Job Service (`backend/job_service/`)

**Responsibility:** Job lifecycle management

**Key Features:**
- Job CRUD operations
- Worker acceptance workflow
- Interactive checklist management
- Real-time progress updates via WebSocket
- Job cancellation with refund
- Expired job detection

**Endpoints:**
```
GET    /jobs                    - List jobs (with filters)
POST   /jobs                    - Create job
GET    /jobs/{id}               - Get job details
PUT    /jobs/{id}               - Update job
DELETE /jobs/{id}               - Cancel job (with refund)
POST   /jobs/{id}/accept        - Accept job (worker)
PUT    /jobs/{id}/checklist     - Update checklist
POST   /jobs/{id}/complete      - Mark complete
POST   /jobs/{id}/withdraw      - Worker withdraws
POST   /jobs/{id}/reopen        - Reopen after withdraw
POST   /jobs/{id}/refund        - Refund expired job
GET    /jobs/my-jobs            - Get user's jobs
GET    /jobs/expired            - Get expired jobs
```

**Workflow States:**
```
OPEN → ACTIVE → IN_PROGRESS → COMPLETED
  ↓       ↓          ↓
CANCELLED  ←─────────┘
```

**Payment States:**
```
PENDING → LOCKED → RELEASED
    ↓         ↓
  FAILED   REFUNDED
```

**Technologies:**
- FastAPI with async SQLAlchemy
- JSONB for checklist storage
- WebSocket integration for real-time updates
- Service-to-service calls to Payment Service

**Database Tables:**
- `jobs` - Job listings with JSONB checklist

---

### 3. Payment Service (`backend/payment_service/`)

**Responsibility:** Blockchain integration and escrow management

**Key Features:**
- Smart contract interaction
- Fund locking on job creation
- Payment release on completion
- Refund handling (expired & cancelled)
- Wallet balance queries
- Transaction history

**Endpoints:**
```
POST   /escrow/lock             - Lock funds in escrow
POST   /escrow/release          - Release to worker
POST   /escrow/refund           - Refund expired job
POST   /escrow/cancel           - Cancel before deadline
GET    /balance/{wallet}        - Get wallet balance
GET    /escrow/stats            - Contract statistics
```

**Blockchain Integration:**
- Web3.py for Ethereum interaction
- Deterministic key derivation for Ganache accounts
- Transaction signing and submission
- Event monitoring

**Smart Contract Functions:**
```solidity
createJob(jobId, timeLimitHours) payable
releasePayment(jobId, worker)
refundExpiredJob(jobId)           // After deadline
cancelJob(jobId)                   // Before deadline
withdrawPlatformFees()
getContractStats()
```

**Technologies:**
- Web3.py 6.11
- Hardhat for contract deployment
- Solidity 0.8.20
- ethers.js (frontend)

**Database Tables:**
- None (stateless, relies on blockchain)

---

### 4. WebSocket Server (`backend/websocket_server/`)

**Responsibility:** Real-time event broadcasting

**Key Features:**
- Socket.io server
- Channel-based subscriptions
- Event broadcasting to connected clients
- API key authentication for service calls

**Events Broadcasted:**
```javascript
// Job Events
job_created              // New job posted
job_accepted             // Worker accepted
job_completed            // Job submitted
job_refunded             // Auto refund
job_withdrawn            // Worker withdrew
job_reopened             // Job reopened
job_cancelled_refunded   // Employer cancelled

// Payment Events
payment_confirmed        // Payment released

// Progress Events
checklist_updated        // Progress changed
```

**Channels:**
- `jobs` - Job-related events
- `payments` - Payment events

**Technologies:**
- Python Socket.io 5.10
- Redis pub/sub for multi-instance support
- API key authentication

---

### 5. Central Authentication Guard

**Location:** `backend/shared/auth_guard.py`

**Purpose:** Centralized authentication and authorization across all services

**Key Functions:**

```python
def get_current_user(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Extract and validate JWT token from request"""
    # 1. Extract token from Authorization header
    # 2. Verify JWT signature
    # 3. Check token expiration
    # 4. Check Redis blacklist
    # 5. Return user payload
    
def require_employer(user: dict = Depends(get_current_user)) -> dict:
    """Ensure user is an employer"""
    
def require_worker(user: dict = Depends(get_current_user)) -> dict:
    """Ensure user is a worker"""
    
def get_current_user_optional(...) -> Optional[dict]:
    """Optional authentication for public endpoints"""
```

**Features:**
- JWT token verification
- Token blacklist checking (Redis)
- User type validation (employer/worker)
- Error handling with proper HTTP status codes
- Dependency injection for FastAPI routes

**Security Flow:**
```
Request → Extract Authorization header
    ↓
Verify JWT signature
    ↓
Check expiration
    ↓
Query Redis blacklist
    ↓
Return user dict or raise 401
```

**Usage Example:**
```python
@app.get("/jobs")
async def list_jobs(
    user: dict = Depends(get_current_user),  # ← Auth Guard
    session: AsyncSession = Depends(get_db_session)
):
    # user = {"sub": "1", "wallet": "0x...", "user_type": "worker"}
    # Route automatically protected
```

---

## Authentication & Security

### Authentication Flow

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Backend │
│(MetaMask)│                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │  1. GET /auth/nonce/{wallet}  │
     │──────────────────────────────▶│
     │                               │
     │  2. Return nonce              │
     │◀──────────────────────────────│
     │                               │
     │  3. Sign message with wallet  │
     │     (using MetaMask)          │
     │                               │
     │  4. POST /auth/login          │
     │     {wallet, signature}       │
     │──────────────────────────────▶│
     │                               │
     │     5. Verify signature       │
     │        (recover address)      │
     │                               │
     │  6. Return JWT tokens         │
     │     {access_token, refresh}   │
     │◀──────────────────────────────│
     │                               │
     │  7. Store tokens in memory    │
     │                               │
     │  8. Subsequent requests       │
     │     Authorization: Bearer ... │
     │──────────────────────────────▶│
     │                               │
     │     9. Validate JWT           │
     │        Check blacklist        │
     │                               │
     │  10. Return response          │
     │◀──────────────────────────────│
```

### Security Features

**1. JWT Authentication**
- Access token: 60 minutes expiration
- Refresh token: 7 days expiration
- HS256 algorithm
- Secure random 256-bit secret

**2. Token Blacklisting**
- Redis-backed blacklist
- Automatic cleanup on expiration
- Logout invalidates all tokens

**3. Signature Verification**
- MetaMask message signing
- Address recovery from signature
- Nonce prevents replay attacks

**4. CORS Configuration**
```python
allow_origins = ["http://localhost:5173"]
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

**5. Security Headers**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

**6. Rate Limiting**
- Per-IP rate limits
- Service-to-service API keys
- Brute force protection

**7. Input Validation**
- Pydantic models for all inputs
- SQL injection prevention (ORM)
- XSS protection

**8. Network Isolation**
```yaml
networks:
  frontend-net:    # Frontend ↔ Gateway
  backend-net:     # Services ↔ Services
  database-net:    # Services ↔ DB (internal only)
  blockchain-net:  # Payment ↔ Ganache
```

---

## Database Architecture

### PostgreSQL Schema

```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    wallet_address_hash VARCHAR(64) UNIQUE NOT NULL,  -- bcrypt hash
    email VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL,  -- 'employer' or 'worker'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER REFERENCES users(id),
    worker_id INTEGER REFERENCES users(id),
    
    -- Job Details
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    
    -- Payment
    pay_amount_usd NUMERIC(10,2) NOT NULL,
    pay_amount_eth NUMERIC(20,18) NOT NULL,
    platform_fee_usd NUMERIC(10,2) DEFAULT 0,
    platform_fee_eth NUMERIC(20,18) DEFAULT 0,
    
    -- Timing
    time_limit_hours INTEGER NOT NULL,
    accepted_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Checklist (JSONB)
    checklist JSONB NOT NULL DEFAULT '[]',
    
    -- Blockchain
    contract_address VARCHAR(42),
    contract_job_id INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open',
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_jobs_worker ON jobs(worker_id);
CREATE INDEX idx_jobs_created ON jobs(created_at);
CREATE INDEX idx_users_wallet_hash ON users(wallet_address_hash);
```

### JSONB Checklist Structure

```json
[
  {
    "id": 1,
    "text": "Setup development environment",
    "completed": true
  },
  {
    "id": 2,
    "text": "Implement authentication",
    "completed": true
  },
  {
    "id": 3,
    "text": "Deploy to production",
    "completed": false
  }
]
```

### Redis Data Structures

```
# Token Blacklist
blacklist:{jti} = "1"  (TTL: token expiration)

# Pub/Sub Channels
channel:websocket:broadcast

# Session Data (optional)
session:{user_id} = {user_data}
```

---

## Blockchain Integration

### Smart Contract: PayChainEscrow.sol

**Location:** `blockchain/contracts/PayChainEscrow.sol`

**Key Features:**
- 2% platform fee
- Time-based deadline enforcement
- Employer cancellation (before worker assigned)
- Automatic refund on expiration
- Platform fee withdrawal

**State Variables:**
```solidity
address public owner;
uint256 public platformFeePercent = 2;
uint256 public totalEscrowLocked;
uint256 public totalFeesCollected;

struct Job {
    uint256 jobId;
    address payable employer;
    address payable worker;
    uint256 amount;
    uint256 workerAmount;
    uint256 platformFee;
    uint256 deadline;
    bool isLocked;
    bool isCompleted;
    bool isRefunded;
    uint256 createdAt;
}
```

**Main Functions:**

```solidity
// Create job and lock funds
function createJob(
    uint256 _jobId,
    uint256 _timeLimitHours
) external payable {
    // Calculate amounts
    uint256 platformFee = (msg.value * 2) / 100;
    uint256 workerAmount = msg.value - platformFee;
    
    // Create job
    jobs[_jobId] = Job({...});
    totalEscrowLocked += msg.value;
}

// Release payment to worker
function releasePayment(
    uint256 _jobId,
    address payable _worker
) external onlyOwner {
    // Transfer worker amount
    _worker.transfer(job.workerAmount);
    totalFeesCollected += job.platformFee;
}

// Refund expired job
function refundExpiredJob(uint256 _jobId) external {
    require(block.timestamp > job.deadline);
    job.employer.transfer(job.amount);  // Full refund
}

// Cancel job before deadline
function cancelJob(uint256 _jobId) external {
    require(msg.sender == job.employer);
    require(job.worker == address(0));  // No worker assigned
    job.employer.transfer(job.amount);  // Full refund
}

// Platform withdraws fees
function withdrawPlatformFees() external onlyOwner {
    payable(owner).transfer(totalFeesCollected);
}
```

### Deployment Configuration

**Network:** Ganache (Local Development)
```javascript
// hardhat.config.js
networks: {
  localhost: {
    url: "http://ganache:8545",
    chainId: 1337,
    accounts: ["0xac0974..."] // Platform owner key
  }
}
```

**Deployment Script:** `blockchain/scripts/deploy.js`
```javascript
const escrow = await PayChainEscrow.deploy();
await escrow.waitForDeployment();

// Save address to .env
const address = await escrow.getAddress();
fs.writeFileSync('.env', `CONTRACT_ADDRESS=${address}`);

// Save ABI to payment service
fs.writeFileSync(
  'backend/payment_service/contract_abi.json',
  JSON.stringify(artifact.abi)
);
```

---

## Real-Time Communication

### WebSocket Architecture

**Technology:** Socket.io (Python server, JS client)

**Connection Flow:**
```
Client connects → Authenticate → Subscribe to channels → Receive events
```

**Event Broadcasting:**
```python
# Server (job_service/main.py)
async def ws_broadcast(message_type: str, data: dict):
    await client.post(
        f"{WS_URL}/broadcast",
        json={"type": message_type, "data": data},
        headers={"X-Service-API-Key": API_KEY}
    )
```

**Client Subscription:**
```javascript
// Frontend (useWebSocketNotifications.jsx)
const { on, subscribe } = useWebSocket()

useEffect(() => {
  subscribe(['jobs', 'payments'])
  
  on('job_created', (data) => {
    toast.success(`New job: ${data.title}`)
    queryClient.invalidateQueries(['jobs'])
  })
  
  on('checklist_updated', (data) => {
    queryClient.invalidateQueries(['job', data.job_id])
  })
}, [])
```

### WebSocket Events

| Event | Trigger | Data | Handlers |
|-------|---------|------|----------|
| `job_created` | POST /jobs | `{job_id, title, pay}` | Worker dashboard refresh |
| `job_accepted` | POST /jobs/:id/accept | `{job_id, worker}` | Employer notification |
| `job_completed` | POST /jobs/:id/complete | `{job_id}` | Both parties |
| `job_cancelled_refunded` | DELETE /jobs/:id | `{job_id, refund_amount}` | Employer balance update |
| `checklist_updated` | PUT /jobs/:id/checklist | `{job_id, progress_percent}` | Employer progress bar |
| `job_refunded` | Expired job refund | `{job_id, reason}` | Employer notification |
| `job_withdrawn` | Worker withdraws | `{job_id}` | Employer notification |
| `job_reopened` | After withdraw | `{job_id}` | Workers |
| `payment_confirmed` | Payment released | `{job_id, amount}` | Worker balance update |

### React Query Integration

WebSocket events trigger cache invalidation:
```javascript
on('job_created', () => {
  queryClient.invalidateQueries(['jobs'])
  queryClient.invalidateQueries(['open-jobs'])
  queryClient.invalidateQueries(['stats'])
})

on('job_cancelled_refunded', (data) => {
  queryClient.invalidateQueries(['wallet-balance'])
  queryClient.invalidateQueries(['my-jobs'])
  queryClient.invalidateQueries(['job', data.job_id])
})
```

---

## Frontend Architecture

### React Application Structure

```
frontend/src/
├── main.jsx                 # App entry point
├── App.jsx                  # Root component with routes
├── index.css                # Tailwind imports
│
├── components/              # Reusable UI components
│   ├── auth/
│   │   ├── RegistrationModal.jsx
│   │   └── WalletConnect.jsx
│   ├── common/
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx
│   ├── dashboard/
│   │   ├── StatsCard.jsx
│   │   ├── QuickActions.jsx
│   │   ├── RecentJobs.jsx
│   │   └── JobRecommendations.jsx
│   ├── job/
│   │   ├── JobCard.jsx
│   │   ├── JobForm.jsx
│   │   ├── JobFilters.jsx
│   │   └── ChecklistManager.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── Sidebar.jsx
│   └── wallet/
│       └── WalletBalance.jsx
│
├── contexts/                # Global state
│   ├── AuthContext.jsx      # Authentication state
│   ├── WalletContext.jsx    # MetaMask connection
│   ├── WebSocketContext.jsx # Socket.io connection
│   └── DevModeContext.jsx   # Dev account switcher
│
├── hooks/                   # Custom hooks
│   ├── useAuth.js
│   ├── useWallet.js
│   ├── useWebSocket.js
│   └── useWebSocketNotifications.jsx
│
├── pages/                   # Route components
│   ├── HomePage.jsx
│   ├── DashboardPage.jsx
│   ├── BrowseJobsPage.jsx
│   ├── JobDetailsPage.jsx
│   ├── CreateJobPage.jsx
│   └── EditJobPage.jsx
│
├── services/                # API clients
│   ├── api.js               # Axios instance
│   ├── authService.js       # Auth endpoints
│   ├── jobService.js        # Job endpoints
│   └── paymentService.js    # Payment endpoints
│
├── utils/                   # Helpers
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
│
└── config/
    └── index.js             # Environment config
```

### State Management Strategy

**1. Server State (React Query)**
```javascript
// Automatic caching, refetching, and invalidation
const { data: jobs, isLoading } = useQuery({
  queryKey: ['jobs', filters],
  queryFn: () => jobService.getJobs(filters),
  staleTime: 30000,
  refetchOnWindowFocus: true
})
```

**2. Authentication State (Context)**
```javascript
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const login = async (wallet, signature) => { ... }
  const logout = async () => { ... }
  
  return <AuthContext.Provider value={{...}} />
}
```

**3. Wallet State (Context)**
```javascript
const WalletContext = createContext()

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  
  const connectWallet = async () => { ... }
  
  return <WalletContext.Provider value={{...}} />
}
```

**4. WebSocket State (Context)**
```javascript
const WebSocketContext = createContext()

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const subscribe = (channels) => { ... }
  const on = (event, handler) => { ... }
  
  return <WebSocketContext.Provider value={{...}} />
}
```

### Routing Structure

```javascript
<Routes>
  <Route path="/" element={<HomePage />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/jobs" element={<BrowseJobsPage />} />
    <Route path="/jobs/:id" element={<JobDetailsPage />} />
    <Route path="/jobs/create" element={<CreateJobPage />} />
    <Route path="/jobs/:id/edit" element={<EditJobPage />} />
  </Route>
  
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

---

## Data Flow

### Complete Job Creation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER INITIATES JOB CREATION                                   │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: CreateJobPage.jsx                                       │
│ • User fills form (title, description, budget, deadline)          │
│ • Click "Post Job" button                                         │
│ • Form validation with Pydantic                                   │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: jobService.createJob()                                  │
│ POST /jobs                                                         │
│ Headers: { Authorization: "Bearer <JWT>" }                        │
│ Body: {                                                            │
│   title, description, job_type,                                   │
│   pay_amount_usd, time_limit_hours, checklist                    │
│ }                                                                  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Job Service: POST /jobs                                           │
│ 1. Auth Guard validates JWT                                       │
│ 2. Extract user from token                                        │
│ 3. Verify user_type = "employer"                                 │
│ 4. Calculate ETH amount (USD * 0.000244)                         │
│ 5. Calculate platform fee (2%)                                    │
│ 6. Create job in database                                         │
│    status = "open", payment_status = "pending"                   │
│ 7. Get job.id (e.g., id=5)                                        │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Job Service → Payment Service                                     │
│ POST /escrow/lock                                                  │
│ Headers: { X-Service-API-Key: "<key>" }                          │
│ Body: {                                                            │
│   job_id: 5,                                                       │
│   employer_wallet: "0xf39Fd...",                                  │
│   amount_eth: "0.1244",  // 0.122 + 2%                           │
│   time_limit_hours: 24                                            │
│ }                                                                  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Payment Service: Blockchain Client                                │
│ 1. Derive employer private key from wallet address                │
│ 2. Build transaction:                                              │
│    contract.createJob(5, 24).value(0.1244 ETH)                   │
│ 3. Sign with employer key                                         │
│ 4. Send to blockchain                                              │
│ 5. Wait for receipt                                                │
│ 6. Return {tx_hash, contract_address, status}                    │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Smart Contract: createJob()                                       │
│ 1. Validate input (value, time limit, job ID unique)             │
│ 2. Calculate: platformFee = 0.1244 * 2% = 0.002488 ETH          │
│ 3. Calculate: workerAmount = 0.1244 - 0.002488 = 0.121912 ETH   │
│ 4. Create Job struct:                                             │
│    jobs[5] = {                                                     │
│      jobId: 5,                                                     │
│      employer: 0xf39Fd...,                                        │
│      worker: 0x0,                                                  │
│      amount: 0.1244 ETH,                                          │
│      workerAmount: 0.121912 ETH,                                  │
│      platformFee: 0.002488 ETH,                                   │
│      deadline: now + 24 hours,                                    │
│      isLocked: true,                                               │
│      isCompleted: false,                                           │
│      isRefunded: false                                             │
│    }                                                               │
│ 5. totalEscrowLocked += 0.1244 ETH                               │
│ 6. Emit JobCreated event                                          │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Payment Service: Return Success                                   │
│ {                                                                  │
│   transaction_hash: "0x1fe83...",                                │
│   contract_address: "0x9fE467...",                                │
│   gas_used: 285000,                                                │
│   status: "confirmed"                                              │
│ }                                                                  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Job Service: Update Database                                      │
│ UPDATE jobs SET                                                    │
│   contract_address = "0x9fE467...",                               │
│   contract_job_id = 5,                                            │
│   payment_status = "locked"                                        │
│ WHERE id = 5;                                                      │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Job Service → WebSocket Server                                    │
│ POST /broadcast                                                    │
│ Headers: { X-Service-API-Key: "<key>" }                          │
│ Body: {                                                            │
│   type: "job_created",                                            │
│   data: {                                                          │
│     job_id: 5,                                                     │
│     title: "React Developer Needed",                              │
│     pay_amount_usd: 500,                                          │
│     job_type: "web_development"                                   │
│   },                                                               │
│   channel: "jobs"                                                  │
│ }                                                                  │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ WebSocket Server: Broadcast to All Workers                        │
│ socket.emit("job_created", {                                      │
│   job_id: 5,                                                       │
│   title: "React Developer Needed",                                │
│   pay_amount_usd: 500                                             │
│ })                                                                 │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: useWebSocketNotifications.jsx                           │
│ handleJobCreated((data) => {                                      │
│   // Show toast                                                    │
│   toast.success(                                                   │
│     `🆕 New Job Available: ${data.title} • $${data.pay}`         │
│   )                                                                │
│                                                                    │
│   // Invalidate queries                                           │
│   queryClient.invalidateQueries(['jobs'])                         │
│   queryClient.invalidateQueries(['open-jobs'])                    │
│   queryClient.invalidateQueries(['stats'])                        │
│ })                                                                 │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: React Query Refetch                                     │
│ • HomePage worker dashboard refetches job list                    │
│ • BrowseJobsPage shows new job                                    │
│ • Stats update with new job count                                 │
│                                                                    │
│ Result: All workers see new job in real-time!                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Docker Compose Services

```yaml
services:
  # Frontend
  frontend:
    image: node:20-slim
    ports: ["5173:5173"]
    networks: [frontend-net]
    
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports: ["8000:80"]
    networks: [frontend-net, backend-net]
    
  # Backend Services
  user-service:
    build: backend/user_service
    ports: ["8002:8000"]
    networks: [backend-net, database-net]
    depends_on: [postgres, redis]
    
  job-service:
    build: backend/job_service
    ports: ["8003:8000"]
    networks: [backend-net, database-net]
    depends_on: [postgres, payment-service]
    
  payment-service:
    build: backend/payment_service
    ports: ["8004:8000"]
    networks: [backend-net, database-net, blockchain-net]
    depends_on: [postgres, ganache]
    volumes:
      - ./blockchain/artifacts:/app/contracts:ro
    
  websocket-server:
    build: backend/websocket_server
    ports: ["8080:8000"]
    networks: [backend-net]
    
  # Data Layer
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    networks: [database-net]
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 5s
      
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    networks: [backend-net]
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
      
  ganache:
    image: trufflesuite/ganache:latest
    ports: ["8545:8545"]
    networks: [blockchain-net]
    command:
      - --wallet.mnemonic="test test test test test test test test test test test junk"
      - --wallet.totalAccounts=10
      - --wallet.defaultBalance=1000
      - --chain.networkId=1337
      - --chain.chainId=1337

networks:
  frontend-net: {}
  backend-net: {}
  database-net: {internal: true}
  blockchain-net: {}

volumes:
  postgres-data: {}
  redis-data: {}
```

### Environment Variables

```bash
# Database
POSTGRES_PASSWORD=<secure_password>
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/paychain_db

# JWT
JWT_SECRET_KEY=<256-bit-random-hex>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Service API Keys
USER_SERVICE_API_KEY=<random-key>
JOB_SERVICE_API_KEY=<random-key>
PAYMENT_SERVICE_API_KEY=<random-key>
WS_SERVICE_API_KEY=<random-key>

# Blockchain
BLOCKCHAIN_URL=http://ganache:8545
CONTRACT_ADDRESS=<deployed-contract-address>
PLATFORM_PRIVATE_KEY=<ganache-account-0-key>

# URLs
PAYMENT_SERVICE_URL=http://payment-service:8000
USER_SERVICE_URL=http://user-service:8000
JOB_SERVICE_URL=http://job-service:8000
WEBSOCKET_SERVER_URL=http://websocket-server:8000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Security Features

### 1. Authentication Security
- ✅ JWT with short expiration (60 min)
- ✅ Refresh token rotation
- ✅ Token blacklist on logout
- ✅ Signature-based authentication
- ✅ No password storage

### 2. Authorization
- ✅ Role-based access (employer/worker)
- ✅ Resource ownership validation
- ✅ Service-to-service API keys

### 3. Input Validation
- ✅ Pydantic models for all inputs
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection (React escaping)

### 4. Network Security
- ✅ Internal database network
- ✅ Reverse proxy (Nginx)
- ✅ CORS configuration
- ✅ Security headers

### 5. Data Protection
- ✅ Wallet address hashing (bcrypt)
- ✅ HTTPS in production
- ✅ Environment variable secrets

### 6. Blockchain Security
- ✅ Smart contract audit patterns
- ✅ Reentrancy protection
- ✅ Access modifiers
- ✅ Input validation

---

## API Structure

### REST API Conventions

**Base URL:** `http://localhost:8000`

**Authentication:**
```
Authorization: Bearer <access_token>
```

**Response Format:**
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed"
}
```

**Error Format:**
```json
{
  "detail": "Error description"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 204: No Content (delete)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

### Complete Endpoint List

See [API.md](API.md) for full documentation.

---

## Conclusion

PayChain demonstrates :

- ✅ **Microservices** - Independent, scalable services
- ✅ **Blockchain** - Smart contract escrow
- ✅ **Real-Time** - WebSocket notifications
- ✅ **Security** - JWT auth, encryption, validation
- ✅ **Modern Stack** - React, FastAPI, PostgreSQL
- ✅ **DevOps** - Docker Compose, automated deployment

This architecture supports:
- High availability
- Horizontal scaling
- Security best practices
- Developer productivity
- Production deployment

---


