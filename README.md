# 🏗️ PayChain - Blockchain-Based Escrow Platform

> **Trustless payments for the gig economy powered by smart contracts**

PayChain is a full-stack microservices application demonstrating React + Python + PostgreSQL expertise. Employers lock funds in blockchain escrow when posting jobs, workers receive automatic payment upon completion. Built with modern best practices and production-ready architecture.

![React](https://img.shields.io/badge/React-18-blue)
![Python](https://img.shields.io/badge/Python-FastAPI-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.27-purple)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## � Tech Stack Demonstration

This project showcases expertise in:
- ✅ **React** - Hooks, Context API, React Query, WebSockets
- ✅ **Python Microservices** - FastAPI, async/await, SQLAlchemy
- ✅ **PostgreSQL** - Complex queries, transactions, relationships
- ✅ **Docker** - Multi-container orchestration
- ✅ **Real-time** - WebSocket notifications
- ✅ **Blockchain** - Ethereum smart contracts
- ✅ **Security** - JWT authentication, rate limiting, security headers

---

## 🚀 Quick Start (3 Commands)

```bash
git clone https://github.com/DeepakPratapa/paychain.git
cd paychain
./scripts/restart-server.sh
```

**Access:** http://localhost

**Documentation:**
- 📖 [Deployment Guide](docs/DEPLOYMENT.md) - Full setup instructions
- 🔧 [Environment Setup](docs/ENV_SETUP.md) - Configuration options
- 🔒 [Security Improvements](docs/SECURITY_IMPROVEMENTS.md) - **NEW** Security features
- 📚 [API Documentation](docs/API.md) - Complete API reference
<!-- - 🏛️ [Architecture](docs/Architecture.md) - System design -->

---

## 🏛️ Architecture

### Microservices Design

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    React     │────▶│     Nginx    │────▶│ API Gateway  │
│   Frontend   │     │Reverse Proxy │     │  (Port 5000) │
│ (Port 3000)  │     │  (Port 80)   │     └──────┬───────┘
└──────────────┘     └──────────────┘            │
                                          ┌───────┴───────┐
                                          │               │
                                   ┌──────▼─────┐  ┌─────▼──────┐
                                   │    User    │  │    Job     │
                                   │  Service   │  │  Service   │
                                   │ (Port 5001)│  │(Port 5002) │
                                   └──────┬─────┘  └─────┬──────┘
                                          │              │
                    ┌─────────────────────┼──────────────┼─────────┐
                    │                     │              │         │
             ┌──────▼──────┐      ┌──────▼──────┐  ┌────▼─────┐  │
             │   Payment   │      │  WebSocket  │  │PostgreSQL│  │
             │   Service   │      │   Server    │  │ Database │  │
             │ (Port 5003) │      │ (Port 5004) │  └──────────┘  │
             └──────┬──────┘      └─────────────┘                │
                    │                                             │
             ┌──────▼──────┐      ┌─────────────┐                │
             │   Hardhat   │      │    Redis    │◀───────────────┘
             │ Blockchain  │      │    Cache    │
             │ (Port 8545) │      │ (Port 6379) │
             └─────────────┘      └─────────────┘
```

### Technology Stack

**Frontend:**
- React 18 + Vite
- TanStack Query (data fetching)
- Tailwind CSS (styling)
- ethers.js (blockchain)
- Socket.io (WebSockets)

**Backend (Python FastAPI):**
- **API Gateway** - Request routing, CORS
- **User Service** - Auth, JWT, users
- **Job Service** - Job CRUD, workflow
- **Payment Service** - Blockchain integration
- **WebSocket Server** - Real-time notifications

**Database & Infrastructure:**
- PostgreSQL 16 (with async SQLAlchemy)
- Redis 7 (token blacklist, pub/sub)
- Hardhat (local Ethereum node)
- Docker Compose (orchestration)
- Nginx (reverse proxy)

---

## 📁 Project Structure

```
paychain/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # Auth, Wallet, WebSocket
│   │   ├── pages/           # Page routes
│   │   ├── services/        # API clients
│   │   └── hooks/           # Custom hooks
│   └── package.json
│
├── backend/                  # Python microservices
│   ├── shared/              # Common utilities
│   │   ├── auth.py          # JWT functions
│   │   ├── auth_guard.py    # Authentication guard
│   │   ├── database.py      # DB connection
│   │   └── config.py        # Configuration
│   ├── api_gateway/         # Request routing
│   ├── user_service/        # Authentication
│   ├── job_service/         # Job management
│   ├── payment_service/     # Blockchain ops
│   └── websocket_server/    # Real-time events
│
├── blockchain/              # Smart contracts
│   ├── contracts/           # Solidity contracts
│   ├── scripts/             # Deployment scripts
│   └── hardhat.config.js    # Hardhat config
│
├── database/
│   ├── init.sql             # Schema definition
│   └── seed.sql             # Demo data
│
├── docs/                    # Documentation
│   ├── API.md              # API reference
│   └── Architecture.md      # System design

    
│
├── scripts/                 # Automation scripts
│   ├── setup-dev.sh        # Initial setup
│   ├── start-demo.sh       # Start services
│   └── restart-server.sh   # Quick restart
│
├── docker-compose.yml       # Container orchestration
├── DEPLOYMENT.md           # Deployment guide
└── ENV_SETUP.md            # Environment config
```

---

## 🎮 Key Features

### 1. MetaMask Authentication
- Signature-based login (no passwords!)
- Wallet ownership verification
- JWT token management
- Automatic reconnection

### 2. Job Management
- Create jobs with escrow
- Worker acceptance workflow
- Interactive checklists
- Deadline tracking

### 3. Blockchain Escrow
- Funds locked on job creation
- Auto-release on completion
- Refund on expiration
- Full transaction history

### 4. Real-time Updates
- WebSocket notifications
- Job status changes
- Payment confirmations
- Live dashboard updates

### 5. Modern UI/UX
- Responsive design
- Loading states
- Error handling
- Toast notifications

---

## 📚 API Endpoints

### Authentication
```
POST   /auth/challenge        Get signing challenge
POST   /auth/verify          Verify signature & login
POST   /auth/signup          Complete registration
POST   /auth/refresh         Refresh access token
POST   /auth/logout          Logout (blacklist token)
```

### Jobs
```
GET    /jobs                 List all jobs
POST   /jobs                 Create new job
GET    /jobs/{id}            Get job details
PUT    /jobs/{id}            Update job
DELETE /jobs/{id}            Delete job
POST   /jobs/{id}/accept     Accept job (worker)
POST   /jobs/{id}/complete   Complete job
POST   /jobs/{id}/withdraw   Withdraw from job
```

### Payments
```
GET    /balance              Get wallet balance
POST   /fund-job             Lock funds in escrow
POST   /release-payment      Release payment to worker
POST   /refund-job           Refund to employer
GET    /transactions         Transaction history
```

Full docs: [docs/API.md](docs/API.md)

---

## 🔐 Security Features

- ✅ JWT authentication with expiration
- ✅ Token blacklist (logout)
- ✅ MetaMask signature verification
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (ORM)
- ✅ CORS configuration
- ✅ Service-to-service auth
- ✅ Docker network isolation

---

## 🎯 Demo Accounts

**Test Accounts (Pre-funded with ETH):**

```javascript
// Account #0 - Employer
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// Account #1 - Worker
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### Demo Accounts
Press `Ctrl+Shift+D` in the frontend to open dev tools and switch between users:

**Employers:**
- TechStartupCo: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- DesignAgency: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

**Workers:**
- AliceDev: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- BobDesigner: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- CarolWriter: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`

Import these into MetaMask to test the full workflow.

---

## 🛠️ Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm
- MetaMask browser extension

### Local Development

```bash
# Frontend only
cd frontend
npm install
npm run dev

# Backend service
cd backend/user_service
pip install -r requirements.txt
uvicorn main:app --reload --port 5001

# Database
docker-compose up postgres -d
```

### Useful Commands

```bash
# Restart everything
./scripts/restart-server.sh

# View logs
docker-compose logs -f

# Check service health
curl http://localhost:5000/health

# Database access
docker exec -it paychain-postgres psql -U paychain -d paychain
```

---

## 📊 Database Schema

Key tables:
- **users** - User accounts with wallet addresses
- **jobs** - Job listings with JSONB checklists
- **transactions** - Blockchain transaction records

Indexes on:
- `users.wallet_address_hash` (unique)
- `jobs.status`, `jobs.employer_id`, `jobs.worker_id`
- `transactions.job_id`, `transactions.from_user_id`

See [database/init.sql](database/init.sql) for complete schema.

---

## 🚀 Deployment

### Docker Compose (Recommended)

```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide including:
- Environment variables
- Production configuration
- SSL/TLS setup
- Scaling strategies

---

## 🗺️ Roadmap

### Current Features ✅
- MetaMask authentication
- Job creation & management
- Blockchain escrow
- Real-time notifications
- Responsive UI

### Planned Features 📋
- User profiles & ratings
- Job application system
- Direct messaging
- Email notifications
- Multi-currency support
### Phase 1: MVP+ (2-4 weeks)
- [ ] Rating system
- [ ] In-app messaging
- [ ] Email notifications
- [ ] Job templates

### Phase 2: Platform Growth (2-3 months)
- [ ] AI-powered job matching
- [ ] Multi-currency support
- [ ] Milestone payments
- [ ] Mobile app

### Phase 3: Web3 Evolution (6-12 months)
- [ ] Ethereum mainnet deployment
- [ ] Multi-chain support
- [ ] NFT credentials
- [ ] DAO governance
---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Deepak Pratapa**

Demonstrating full-stack development expertise with React, Python, PostgreSQL, and microservices architecture.

- GitHub: [@DeepakPratapa](https://github.com/DeepakPratapa)
- Repository: [paychain](https://github.com/DeepakPratapa/paychain)

---

## 🙏 Acknowledgments

- FastAPI for excellent Python framework
- React team for modern frontend library
- Hardhat for Ethereum development
- OpenZeppelin for smart contract patterns

---

**⭐ If this project demonstrates the skills you're looking for, let's connect!**

