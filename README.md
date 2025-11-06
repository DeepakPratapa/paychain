# 🏗️ PayChain - Blockchain-Based Escrow Platform

> **Trustless payments for the gig economy powered by smart contracts**

PayChain is a **full-stack blockchain escrow platform** that enables secure payments between employers and workers through Ethereum smart contracts. Built with modern microservices architecture, it demonstrates best practices for authentication, real-time communication, and blockchain integration.

![React](https://img.shields.io/badge/React-18.2-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-purple)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## 🎯 What Makes PayChain Special?

### Core Features

✅ **MetaMask Authentication** - Signature-based login (no passwords!)  
✅ **Smart Contract Escrow** - Trustless fund locking with automated release  
✅ **Dual Refund Logic** - Cancel before deadline OR refund after expiration  
✅ **Real-Time Notifications** - WebSocket-powered instant updates  
✅ **Microservices Architecture** - 5 independent, scalable services  
✅ **Centralized Auth Guard** - JWT verification across all services  
✅ **React Query Integration** - Automatic cache invalidation and UI updates  
✅ **Interactive Job Checklists** - JSONB-backed progress tracking  
✅ **Platform Fee System** - 2% automated fee collection  
✅ **Security Hardened** - Rate limiting, token blacklist, CORS, security headers  

### Recent Enhancements (November 2025)

🆕 **Smart Contract `cancelJob()`** - Employers can cancel anytime before worker assignment (instant refund)  
🆕 **React Query Migration** - WalletBalance and all data fetching use TanStack Query v5  
🆕 **WebSocket Query Invalidation** - Real-time events trigger automatic cache refresh  
🆕 **Central Auth Guard** - Unified authentication in `backend/shared/auth_guard.py`  
🆕 **Job Seeding Automation** - One-command demo data generation  
🆕 **Master Architecture Doc** - Complete system design reference  

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Git

### One-Command Setup

```bash
git clone https://github.com/DeepakPratapa/paychain.git
cd paychain
./scripts/start-demo.sh
```

**Access:** http://localhost:8000

### Test Accounts

| Type | Wallet Address | Usage |
|------|---------------|-------|
| **Employer 1** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Create jobs |
| **Worker 1** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Accept jobs |
| **Worker 2** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Browse jobs |

**MetaMask Setup:** Import Ganache mnemonic: `test test test test test test test test test test test junk`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[Master Architecture](docs/MASTER_ARCHITECTURE.md)** | Complete system design, data flows, all features |
| **[API Documentation](docs/API.md)** | All REST endpoints with examples |
| **[Deployment Guide](docs/DEPLOYMENT.md)** | Production deployment steps |
| **[Security Guide](docs/SECURITY_IMPROVEMENTS.md)** | Security features and best practices |

---

## 🏛️ Architecture

### Microservices Design

```
┌──────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                 │
│  ┌────────────┐              ┌─────────────┐                     │
│  │   React    │──WebSocket──▶│   Browser   │                     │
│  │  Frontend  │              │  (MetaMask) │                     │
│  └──────┬─────┘              └─────────────┘                     │
└─────────┼──────────────────────────────────────────────────────────┘
          │ HTTP
┌─────────▼──────────────────────────────────────────────────────────┐
│                    GATEWAY LAYER                                    │
│  ┌─────────────────────────────────────────────────────┐           │
│  │              Nginx Reverse Proxy                     │           │
│  │         (CORS, Security Headers, SSL)                │           │
│  └───────────────────┬──────────────────────────────────┘           │
└────────────────────┼─────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────┐
│                   MICROSERVICES LAYER                                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     User     │  │     Job      │  │   Payment    │             │
│  │   Service    │  │   Service    │  │   Service    │             │
│  │  (Port 8002) │  │  (Port 8003) │  │  (Port 8004) │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                     │
│  ┌──────▼──────────────────▼──────────────────▼───────┐            │
│  │       Central Authentication Guard                  │            │
│  │     (Shared: backend/shared/auth_guard.py)          │            │
│  │  • JWT Verification  • Token Blacklist Check        │            │
│  │  • User Extraction   • Role Authorization           │            │
│  └──────────────────────────────────────────────────────┘            │
│                                                                      │
│  ┌──────────────┐                                                   │
│  │  WebSocket   │                                                   │
│  │   Server     │                                                   │
│  │  (Port 8080) │                                                   │
│  └──────┬───────┘                                                   │
└─────────┼────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  PostgreSQL  │  │    Redis     │  │   Ganache    │             │
│  │  Database    │  │    Cache     │  │  Blockchain  │             │
│  │  (Port 5432) │  │  (Port 6379) │  │  (Port 8545) │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.2 + Vite 5
- TanStack Query v5 (React Query) - Server state management
- Tailwind CSS 3.4 - Styling
- ethers.js 6.9 - Blockchain interaction
- Socket.io-client 4.6 - Real-time WebSocket
- React Router DOM 6.20 - Client-side routing

**Backend (5 Python FastAPI Microservices):**
1. **User Service** (Port 8002)
   - MetaMask signature authentication
   - JWT token generation & refresh
   - User registration and management
   - Token blacklist (Redis)

2. **Job Service** (Port 8003)
   - Job CRUD operations
   - Worker acceptance workflow
   - Interactive checklist (JSONB)
   - Job cancellation with refund
   - Expired job detection

3. **Payment Service** (Port 8004)
   - Blockchain integration (Web3.py)
   - Smart contract interaction
   - Fund locking (escrow)
   - Payment release
   - Dual refund logic (cancel vs expire)

4. **WebSocket Server** (Port 8080)
   - Socket.io server
   - Real-time event broadcasting
   - Channel-based subscriptions
   - API key authentication

5. **API Gateway** (Port 8001)
   - Request routing
   - CORS handling
   - Rate limiting (planned)

**Database & Infrastructure:**
- PostgreSQL 16 (async SQLAlchemy ORM)
- Redis 7 (token blacklist, pub/sub)
- Ganache (local Ethereum)
- Hardhat (smart contract tooling)
- Docker Compose v2
- Nginx (reverse proxy)

**Smart Contract:**
- Solidity 0.8.20
- PayChainEscrow contract with:
  - `createJob()` - Lock funds
  - `releasePayment()` - Pay worker
  - `refundExpiredJob()` - Refund after deadline
  - `cancelJob()` - Cancel before deadline (**NEW**)
  - 2% platform fee

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ Signature-based MetaMask authentication (no passwords)
- ✅ JWT tokens (access 60min, refresh 7days)
- ✅ Token blacklist on logout (Redis)
- ✅ **Centralized Auth Guard** across all services
- ✅ Role-based access control (employer/worker)

### Network Security
- ✅ CORS configuration (whitelist origins)
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Internal database network (Docker)
- ✅ Service-to-service API keys
- ✅ Rate limiting (in progress)

### Data Protection
- ✅ Wallet address hashing (bcrypt)
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection (React escaping)

### Blockchain Security
- ✅ Smart contract access modifiers
- ✅ Reentrancy protection
- ✅ Input validation in Solidity
- ✅ Platform owner controls

---

## 📊 Key Features Explained

### 1. Dual Refund Logic (Smart Contract)

**Scenario 1: Cancel Before Worker Assignment**
```solidity
function cancelJob(uint256 _jobId) external {
    require(msg.sender == job.employer);
    require(job.worker == address(0)); // No worker assigned
    employer.transfer(job.amount); // Instant full refund
}
```

**Scenario 2: Refund Expired Job**
```solidity
function refundExpiredJob(uint256 _jobId) external {
    require(block.timestamp > job.deadline); // After deadline
    employer.transfer(job.amount); // Full refund
}
```

### 2. Real-Time WebSocket Events

Events broadcasted to connected clients:

| Event | Trigger | Frontend Action |
|-------|---------|----------------|
| `job_created` | Employer posts job | Workers see new job instantly |
| `job_accepted` | Worker accepts | Employer gets notification |
| `job_completed` | Worker submits | Both parties notified |
| `job_cancelled_refunded` | Employer cancels | Balance updates, job removed |
| `checklist_updated` | Progress change | Progress bar updates |
| `payment_confirmed` | Payment released | Worker balance updates |

### 3. React Query Cache Invalidation

WebSocket events automatically refresh UI:

```javascript
on('job_created', () => {
  queryClient.invalidateQueries(['jobs'])
  queryClient.invalidateQueries(['open-jobs'])
  queryClient.invalidateQueries(['stats'])
})

on('job_cancelled_refunded', () => {
  queryClient.invalidateQueries(['wallet-balance'])
  queryClient.invalidateQueries(['my-jobs'])
})
```

### 4. Central Auth Guard

**Location:** `backend/shared/auth_guard.py`

**Usage in all services:**
```python
from shared.auth_guard import get_current_user, require_employer

@app.get("/jobs")
async def list_jobs(
    user: dict = Depends(get_current_user),  # ← Auth Guard
    session: AsyncSession = Depends(get_db_session)
):
    # user = {"sub": "1", "wallet": "0x...", "user_type": "worker"}
    # Route automatically protected
```

**Features:**
- JWT signature verification
- Token expiration check
- Redis blacklist check
- User type validation
- Dependency injection

---

## 🔄 Complete Job Flow

```
1. Employer creates job
   ↓
2. Job Service validates & saves to DB
   ↓
3. Payment Service calls smart contract
   ↓
4. Smart contract locks funds in escrow
   ↓
5. contract_job_id saved to database
   ↓
6. WebSocket broadcasts "job_created" event
   ↓
7. React Query invalidates ['jobs', 'open-jobs']
   ↓
8. All workers see new job instantly (no refresh)
   ↓
9. Worker accepts job
   ↓
10. Job Service updates worker_id & status
   ↓
11. WebSocket notifies employer
   ↓
12. Worker completes checklist
   ↓
13. Job Service marks complete
   ↓
14. Payment Service releases funds
   ↓
15. Smart contract transfers ETH to worker
   ↓
16. WebSocket broadcasts "payment_confirmed"
   ↓
17. Worker balance updates instantly
```

---

## 🛠️ Development

### Project Structure

```
paychain/
├── backend/
│   ├── api_gateway/           # Request routing
│   ├── user_service/          # Auth & users
│   ├── job_service/           # Job CRUD & workflow
│   ├── payment_service/       # Blockchain integration
│   │   ├── blockchain_client.py  # Web3 interactions
│   │   └── contract_abi.json     # Smart contract ABI
│   ├── websocket_server/      # Real-time notifications
│   └── shared/                # Shared modules
│       ├── auth.py            # JWT token creation
│       ├── auth_guard.py      # Central Auth Guard
│       ├── token_blacklist.py # Redis blacklist
│       ├── database.py        # DB connection
│       └── schemas.py         # Pydantic models
├── blockchain/
│   ├── contracts/
│   │   └── PayChainEscrow.sol # Smart contract
│   ├── scripts/
│   │   ├── deploy.js          # Deploy script
│   │   └── check-owner.js     # Verify ownership
│   └── hardhat.config.js      # Hardhat config
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── contexts/          # Auth, Wallet, WebSocket
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Route components
│   │   └── services/          # API clients
│   └── vite.config.js
├── database/
│   ├── init.sql               # Schema definition
│   └── seed.sql               # Demo data
├── docs/
│   ├── MASTER_ARCHITECTURE.md # Complete system design
│   ├── API.md                 # API documentation
│   ├── DEPLOYMENT.md          # Setup guide
│   └── SECURITY_IMPROVEMENTS.md
├             
└── docker-compose.yml
```

### Local Development

**Start services:**
```bash
docker-compose up -d
cd frontend && npm run dev
```

**Deploy smart contract:**
```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```



**Seed demo jobs:**
```bash
cd blockchain
node scripts/seed-jobs.js
```

**Run tests:**
```bash
# Smart contract tests
cd blockchain
npx hardhat test

# Backend tests (when added)
cd backend/job_service
pytest

# Frontend tests (when added)
cd frontend
npm test
```

---

## 🗄️ Database Management

### Viewing the Database

**Access PostgreSQL with psql:**
```bash
# Connect to database
docker exec -it postgres psql -U postgres -d paychain_db

# Common queries
\dt                          # List all tables
\d users                     # Describe users table
SELECT * FROM users;         # View all users
SELECT * FROM jobs;          # View all jobs
\q                           # Exit
```

**View recent jobs with details:**
```bash
docker exec -it postgres psql -U postgres -d paychain_db -c "
SELECT 
    j.id,
    j.title,
    j.status,
    j.payment_status,
    e.username as employer,
    w.username as worker,
    j.pay_amount_usd
FROM jobs j
LEFT JOIN users e ON j.employer_id = e.id
LEFT JOIN users w ON j.worker_id = w.id
ORDER BY j.created_at DESC
LIMIT 10;
"
```

**Access Redis cache:**
```bash
# Connect to Redis
docker exec -it redis redis-cli

# View all keys
KEYS *

# View blacklisted tokens
KEYS blacklist:*

# Exit
exit
```

### Database Tools (GUI)

**Option 1: pgAdmin**
- Host: `localhost`, Port: `5432`
- Database: `paychain_db`
- Username: `postgres`
- Password: (from `.env`)

**Option 2: DBeaver**
- Universal database tool
- Download: https://dbeaver.io/download/

**Option 3: VS Code Extension**
- Install "PostgreSQL" extension
- Connect with same credentials

**Complete database guide:** See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#viewing-and-managing-the-database)

---

## 🚢 Deployment



## 🚢 Deployment

### Production Checklist

- [ ] Replace Ganache with real Ethereum node (Infura/Alchemy)
- [ ] Deploy smart contract to testnet (Sepolia/Goerli)
- [ ] Update `BLOCKCHAIN_URL` in `.env`
- [ ] Set strong `JWT_SECRET_KEY` (256-bit random)
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up environment variables
- [ ] Configure PostgreSQL backups
- [ ] Enable Redis persistence
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Add rate limiting
- [ ] Security audit

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed steps.

---

## 🙏 Acknowledgments

- **Hardhat** - Ethereum development environment
- **FastAPI** - Modern Python web framework
- **React** - UI library
- **TanStack Query** - Powerful data synchronization
- **Socket.io** - Real-time engine

---

## 📞 Support

- **Architecture:** [docs/MASTER_ARCHITECTURE.md](docs/MASTER_ARCHITECTURE.md)
- **Issues:** GitHub Issues

---

**Built with ❤️ by Deepak Pratapa**

*Last Updated: November 4, 2025*
