# 🏗️ PayChain - Blockchain-Based Escrow Platform

> **Trustless payments for the gig economy - where smart contracts ensure fair compensation**

PayChain is a full-stack microservices application that solves the trust problem in freelance work. Employers lock funds in a blockchain escrow when posting jobs, and workers receive automatic payment upon completion. No middlemen, no disputes, just code.

![Tech Stack](https://img.shields.io/badge/React-18.3-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-purple)
![Status](https://img.shields.io/badge/Status-Ready%20for%20Demo-success)

---

## 🎉 **Recent Updates - All Bugs Fixed!**

**Latest:** All authentication and workflow bugs have been resolved! See [BUG_FIXES.md](BUG_FIXES.md) for details.

**What's New:**
- ✅ **Clean wallet connection** - Single, clear "Connect Wallet" button
- ✅ **Registration modal** - Beautiful onboarding for new users
- ✅ **Seamless login** - Returning users auto-login via MetaMask
- ✅ **Dev Mode** - Press `Ctrl+Shift+D` for quick account switching
- ✅ **5 demo accounts** - Pre-configured employers and workers
- ✅ **Complete workflows** - From registration to payment release

**Quick Start:** `./scripts/test-bug-fixes.sh` → http://localhost:3000

---

## 🎯 **Problem & Solution**

**Problem:** Freelancers get stiffed, employers get ghosted. Trust is the #1 barrier in gig economy.

**Solution:** Blockchain escrow that:
- Locks funds when job is created (employer can't pull out)
- Auto-releases on completion (worker guaranteed payment)
- Refunds if job expires (employer protected)
- Transparent & verifiable on blockchain

---

## � Project Structure

```
paychain/
├── blockchain/              # Smart contracts (Solidity)
│   ├── contracts/          # PayChainEscrow.sol
│   ├── scripts/            # Deployment scripts
│   └── hardhat.config.js   # Hardhat configuration
├── backend/                # Python microservices
│   ├── shared/             # Common utilities
│   ├── user_service/       # Authentication (port 8001)
│   ├── job_service/        # Job management (port 8002)
│   ├── payment_service/    # Blockchain integration (port 8003)
│   ├── api_gateway/        # Request routing (port 8000)
│   └── websocket_server/   # Real-time events (port 8080)
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Wallet)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client layer
│   │   └── config/         # Configuration
│   └── package.json
├── database/               # PostgreSQL initialization
│   ├── init.sql            # Schema definition
│   └── seed.sql            # Demo data
├── nginx/                  # Reverse proxy configuration
├── scripts/                # Deployment automation
│   ├── setup-dev.sh        # Initial setup
│   ├── start-demo.sh       # Start all services
│   └── reset-demo.sh       # Reset to initial state
├── docs/                   # Documentation
│   ├── API.md              # Complete API reference
│   └── SECURITY_NOTES.md   # Security considerations
├── docker-compose.yml      # Container orchestration
└── README.md
```

## �🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- MetaMask browser extension

### Setup (< 5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/paychain.git
cd paychain

# Run setup script
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Start all services
./scripts/start-demo.sh
```

### Access Points
- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:8000
- **Ganache Blockchain:** http://localhost:8545
- **PostgreSQL:** localhost:5432

### Demo Accounts
Press `Ctrl+Shift+D` in the frontend to open dev tools and switch between users:

**Employers:**
- TechStartupCo: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- DesignAgency: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

**Workers:**
- AliceDev: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- BobDesigner: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- CarolWriter: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`

---

## 🏛️ **Architecture**

### Microservices Design

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│ API Gateway │────▶│ User Service│
│  Frontend   │     │   (8000)    │     │   (8001)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ├────────────────────┤
                           │                    │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │ Job Service │     │  Payment    │
                    │   (8002)    │     │  Service    │
                    └─────────────┘     │   (8003)    │
                           │            └──────┬──────┘
                           │                   │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │ PostgreSQL  │     │  Ganache    │
                    │  Database   │     │ Blockchain  │
                    └─────────────┘     └─────────────┘
```

### Technology Stack

**Frontend:**
- React 18.3 + Vite
- TanStack Query (React Query)
- Tailwind CSS
- ethers.js
- Socket.io-client

**Backend:**
- Python 3.11 + FastAPI
- SQLAlchemy (async)
- Pydantic v2
- PyJWT
- web3.py

**Infrastructure:**
- PostgreSQL 16
- Ganache (Ethereum)
- Redis 7
- Docker + Docker Compose
- Nginx

---

## 📊 **Database Schema**

Key tables:
- `users` - User accounts with wallet addresses
- `jobs` - Job listings with JSONB checklists
- `transactions` - Blockchain transaction records
- `sessions` - JWT token management

See [database/init.sql](database/init.sql) for complete schema.

---

## 🔐 **Authentication**

PayChain uses **MetaMask signature-based authentication** - no passwords required!

1. User connects MetaMask wallet
2. Backend generates a challenge message
3. User signs with private key
4. Backend verifies signature and issues JWT
5. JWT used for subsequent API calls

---

## 🎮 **User Flow**

### Employer Posts Job
1. Connect MetaMask wallet
2. Fill job details (title, description, pay, deadline)
3. Create checklist of deliverables
4. Confirm transaction in MetaMask
5. Funds locked in smart contract

### Worker Accepts Job
1. Browse available jobs
2. Accept job (first-come-first-served)
3. Complete checklist items
4. Submit completion

### Payment Release
1. Smart contract verifies checklist complete
2. Auto-release payment to worker's wallet
3. Transaction visible on blockchain
4. Worker receives funds instantly

---

## 🛠️ **Development**

### Project Structure

```
paychain/
├── frontend/              # React application
├── backend/
│   ├── api_gateway/      # Request routing
│   ├── user_service/     # Authentication
│   ├── job_service/      # Job management
│   ├── payment_service/  # Blockchain integration
│   └── websocket_server/ # Real-time updates
├── blockchain/           # Smart contracts
├── database/             # SQL schemas
└── nginx/                # Reverse proxy
```

### Running Services Individually

```bash
# Frontend
cd frontend && npm run dev

# Backend service (example: User Service)
cd backend/user_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Database
docker-compose up postgres

# Blockchain
docker-compose up ganache
```

### Running Tests

```bash
# Backend tests
docker-compose exec user-service pytest
docker-compose exec job-service pytest

# Frontend tests
cd frontend && npm test
```

---

## 🔒 **Security**

**Implemented:**
✅ MetaMask signature verification
✅ JWT with expiration
✅ Input validation (Pydantic)
✅ SQL injection prevention (ORM)
✅ CORS restrictions
✅ Service-to-service API keys
✅ Docker network isolation

**Production Requirements:**
See [docs/SECURITY_NOTES.md](docs/SECURITY_NOTES.md) for comprehensive security hardening checklist.

---

## 📚 **API Documentation**

### Key Endpoints

**Authentication:**
- `POST /auth/challenge` - Get signature challenge
- `POST /auth/verify` - Verify signature & get JWT
- `POST /auth/refresh` - Refresh access token

**Jobs:**
- `POST /jobs` - Create job (employer)
- `GET /jobs` - List jobs with filters
- `PUT /jobs/{id}/accept` - Accept job (worker)
- `POST /jobs/{id}/complete` - Complete job

**Payments:**
- `POST /escrow/lock` - Lock funds
- `POST /escrow/release` - Release payment
- `GET /transactions` - Transaction history

Full API docs: [docs/API.md](docs/API.md)

---

## 🎯 **Demo Features**

### Hidden Dev Tools (Ctrl+Shift+D)

Press `Ctrl+Shift+D` to access:
- **Quick User Switch** - Instantly switch between demo accounts
- **Time Manipulation** - Fast-forward time to test deadlines
- **Scenario Triggers** - Quick actions (create job, complete tasks, etc.)
- **System Health** - View all service statuses
- **Demo Reset** - Reset to initial state

---

## 🚢 **Deployment**

### Docker Compose (Recommended)

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Kubernetes, AWS, and manual deployment guides.

---

## 🛣️ **Roadmap**

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

## 🤝 **Contributing**

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

---

## 👤 **Author**

Built by [Your Name] as a full-stack technical demonstration.

**Contact:**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 🙏 **Acknowledgments**

- OpenZeppelin for smart contract patterns
- FastAPI for excellent Python framework
- React team for amazing frontend library
- Ganache for local blockchain testing

---

**⭐ Star this repo if you found it helpful!**
