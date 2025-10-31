# PayChain Master Architecture Document.

# 🏗️ **PAYCHAIN - MASTER ARCHITECTURE DOCUMENT**

## **Executive Summary**

**Project Name:** PayChain

**Purpose:** CEO Demo - Showcase Full-Stack Skills (React, Python, PostgreSQL, Microservices, Blockchain)

**Problem Solved:** Trust issues in gig economy - employers and workers need escrow protection

**Solution:** Blockchain-based escrow system that locks funds at job creation, auto-releases on completion

**Demo Duration:** 10 minutes

**Development Time:** 3-5 days

---

## **TABLE OF CONTENTS**

1. [System Architecture](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
2. [Technology Stack](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
3. [Database Schema](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
4. [Microservices Design](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
5. [Smart Contract](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
6. [Frontend Architecture](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
7. [Authentication & Authorization](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
8. [API Specifications](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
9. [Real-Time Features](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
10. [Developer Tools (Hidden Features)](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
11. [User Flows](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
12. [Security Implementation](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
13. [Docker & Deployment](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
14. [Demo Preparation](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)
15. [Future Enhancements](https://www.notion.so/PayChain-Master-Architecture-Document-29afd5bfeea480039da0ebae5cdf31e5?pvs=21)

---

## **1. SYSTEM ARCHITECTURE**

### **High-Level Architecture Diagram**

`┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx Reverse  │  (Port 80/443)
                    │  Proxy + SSL    │  - Rate Limiting
                    │                 │  - Load Balancing
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
    │   React      │  │    API    │  │  WebSocket  │
    │  Frontend    │  │  Gateway  │  │   Server    │
    │ (Vite:5173)  │  │  (:8000)  │  │   (:8080)   │
    └──────────────┘  └─────┬─────┘  └──────┬──────┘
                            │                │
                            │    ┌───────────┘
                            │    │
        ┌───────────────────┼────┼───────────────────┐
        │                   │    │                   │
┌───────▼──────┐  ┌─────────▼────▼─────┐  ┌─────────▼──────────┐
│     User     │  │       Job          │  │     Payment        │
│   Service    │  │     Service        │  │     Service        │
│   (:8001)    │  │     (:8002)        │  │     (:8003)        │
│              │  │                    │  │                    │
│ - Auth       │  │ - CRUD Jobs        │  │ - Escrow Lock      │
│ - Profiles   │  │ - Accept/Complete  │  │ - Release Payment  │
│ - Wallets    │  │ - Checklists       │  │ - Blockchain Sync  │
└───────┬──────┘  └─────────┬──────────┘  └─────────┬──────────┘
        │                   │                        │
        │                   │                        │
        └───────────────────┼────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    │   Database    │
                    │   (:5432)     │
                    │               │
                    │ - users       │
                    │ - jobs        │
                    │ - transactions│
                    │ - sessions    │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │    Ganache    │
                    │  (Blockchain) │
                    │   (:8545)     │
                    │               │
                    │ - Smart       │
                    │   Contracts   │
                    │ - Escrow      │
                    └───────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DOCKER NETWORKS                             │
├─────────────────────────────────────────────────────────────────┤
│ frontend-net:  Nginx ↔ React ↔ API Gateway                     │
│ backend-net:   API Gateway ↔ All Services                      │
│ database-net:  Services ↔ PostgreSQL (isolated)                │
│ blockchain-net: Payment Service ↔ Ganache (isolated)           │
└─────────────────────────────────────────────────────────────────┘`

### **Network Isolation (True Microservices)**

yaml

`Networks:
  frontend-net:
    - nginx (exposed: 80, 443)
    - react-frontend (exposed: 5173 for dev)
    - api-gateway (internal: 8000)
  
  backend-net:
    - api-gateway
    - user-service (internal: 8001)
    - job-service (internal: 8002)
    - payment-service (internal: 8003)
    - websocket-server (internal: 8080)
  
  database-net:
    - postgresql (internal: 5432)
    - user-service
    - job-service
    - payment-service
  
  blockchain-net:
    - ganache (internal: 8545)
    - payment-service

Security:
  - Services in different networks CANNOT communicate
  - Only API Gateway exposed to frontend
  - PostgreSQL only accessible to services
  - Ganache only accessible to Payment Service
```

*### **Service Communication Patterns***
```
┌─────────────────────────────────────────────────────────────────┐
│ INTER-SERVICE COMMUNICATION (HTTP + Service Keys)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend → API Gateway (JWT Token)                            │
│      ↓                                                          │
│  API Gateway → User Service (Service API Key)                  │
│      ↓                                                          │
│  API Gateway → Job Service (Service API Key)                   │
│      ↓                                                          │
│  Job Service → Payment Service (Service API Key)               │
│      ↓                                                          │
│  Payment Service → Ganache (Web3 Connection)                   │
│                                                                 │
│  WebSocket Server ← All Services (Event Publishing)            │
│      ↓                                                          │
│  WebSocket Server → Frontend (Real-time Updates)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`

---

## **2. TECHNOLOGY STACK**

### **Frontend**

- **Framework:** React 18.3+
- **Build Tool:** Vite 5.x
- **Language:** JavaScript (ES6+)
- **State Management:**
    - React Context API (Auth, Wallet)
    - TanStack Query (React Query) v5 - Server state
- **Routing:** React Router v6
- **Styling:** Tailwind CSS 3.x
- **Forms:** React Hook Form + Zod validation
- **Blockchain:** ethers.js v6
- **HTTP Client:** Axios
- **WebSocket:** socket.io-client
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

### **Backend**

- **Language:** Python 3.11+
- **Framework:** FastAPI 0.104+
- **Async Runtime:** Uvicorn + asyncio
- **Database ORM:** SQLAlchemy 2.0 (async)
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Authentication:** PyJWT + passlib (bcrypt)
- **HTTP Client:** httpx (async)
- **WebSocket:** FastAPI WebSocket
- **Blockchain:** web3.py 6.x
- **Task Queue:** (Skip for demo - use background tasks)

### **Database**

- **RDBMS:** PostgreSQL 16
- **Connection Pooling:** asyncpg
- **Extensions:** pgcrypto (for encryption)

### **Blockchain**

- **Development:** Ganache CLI 7.x
- **Network:** Local (Chain ID: 1337)
- **Smart Contract:** Solidity 0.8.20
- **Compiler:** solc 0.8.20

### **Infrastructure**

- **Containerization:** Docker 24.x + Docker Compose 2.x
- **Reverse Proxy:** Nginx 1.25
- **SSL/TLS:** (Skip for localhost demo)

### **Development Tools**

- **API Testing:** Bruno / Postman
- **Database Client:** DBeaver / pgAdmin
- **Blockchain Explorer:** Ganache UI
- **Code Editor:** VS Code

---

## **3. DATABASE SCHEMA**

### **Complete PostgreSQL Schema**

sql

- `*- ============================================- USERS TABLE- ============================================*
CREATE TABLE users ( id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, wallet_address VARCHAR(42) UNIQUE NOT NULL, *- Ethereum address* wallet_address_hash VARCHAR(64) NOT NULL, *- SHA256 for lookups* user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employer', 'worker')), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), last_login TIMESTAMP WITH TIME ZONE
);
*- Indexes*
CREATE INDEX idx_users_wallet_hash ON users(wallet_address_hash);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_active ON users(is_active);
*- ============================================- JOBS TABLE- ============================================*
CREATE TABLE jobs ( id SERIAL PRIMARY KEY, employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL, *- Job Details* title VARCHAR(200) NOT NULL CHECK (LENGTH(title) >= 5), description TEXT NOT NULL CHECK (LENGTH(description) >= 20), job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('development', 'design', 'writing', 'marketing', 'other')), *- Payment* pay_amount_usd DECIMAL(10, 2) NOT NULL CHECK (pay_amount_usd >= 10 AND pay_amount_usd <= 50000), pay_amount_eth DECIMAL(20, 18) NOT NULL CHECK (pay_amount_eth > 0), platform_fee_usd DECIMAL(10, 2) NOT NULL DEFAULT 0, platform_fee_eth DECIMAL(20, 18) NOT NULL DEFAULT 0, *- Timing* time_limit_hours INTEGER NOT NULL CHECK (time_limit_hours >= 1 AND time_limit_hours <= 720), accepted_at TIMESTAMP WITH TIME ZONE, deadline TIMESTAMP WITH TIME ZONE, completed_at TIMESTAMP WITH TIME ZONE, *- Checklist (JSON)* checklist JSONB NOT NULL DEFAULT '[]', *- Format: [{"id": 1, "text": "Task 1", "completed": false}, ...]* *- Blockchain* contract_address VARCHAR(42), contract_job_id INTEGER, *- Status* status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'expired', 'cancelled')), payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'locked', 'released', 'refunded', 'failed')), *- Timestamps* created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*- Indexes*
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status = 'open';
CREATE INDEX idx_jobs_employer ON jobs(employer_id, status);
CREATE INDEX idx_jobs_worker ON jobs(worker_id, status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_pay ON jobs(pay_amount_usd DESC);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_deadline ON jobs(deadline) WHERE status = 'in_progress';
*- Composite index for common query*
CREATE INDEX idx_jobs_status_type_pay ON jobs(status, job_type, pay_amount_usd DESC);
*- Unique constraint: Worker can only accept job once*
CREATE UNIQUE INDEX idx_jobs_worker_unique ON jobs(id, worker_id) WHERE status = 'in_progress';
*- ============================================- TRANSACTIONS TABLE- ============================================*
CREATE TABLE transactions ( id SERIAL PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, *- Transaction Details* from_wallet VARCHAR(42) NOT NULL, to_wallet VARCHAR(42) NOT NULL, amount_eth DECIMAL(20, 18) NOT NULL, amount_usd DECIMAL(10, 2) NOT NULL, *- Blockchain* tx_hash VARCHAR(66) UNIQUE, *- Ethereum transaction hash* block_number INTEGER, gas_used INTEGER, gas_price_gwei DECIMAL(10, 2), *- Type* transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('escrow_lock', 'payment_release', 'refund', 'platform_fee')), *- Status* status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')), *- Timestamps* created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), confirmed_at TIMESTAMP WITH TIME ZONE
);
*- Indexes*
CREATE INDEX idx_transactions_job ON transactions(job_id);
CREATE INDEX idx_transactions_from ON transactions(from_wallet);
CREATE INDEX idx_transactions_to ON transactions(to_wallet);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
*- ============================================- SESSIONS TABLE (For JWT Token Revocation)- ============================================*
CREATE TABLE sessions ( id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_jti VARCHAR(64) UNIQUE NOT NULL, *- JWT ID* token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')), expires_at TIMESTAMP WITH TIME ZONE NOT NULL, revoked BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*- Indexes*
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_jti ON sessions(token_jti);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
*- Auto-cleanup expired sessions*
CREATE INDEX idx_sessions_cleanup ON sessions(expires_at, revoked) WHERE revoked = FALSE;
*- ============================================- NOTIFICATIONS TABLE (Optional for Demo)- ============================================*
CREATE TABLE notifications ( id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(200) NOT NULL, message TEXT NOT NULL, notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('job_posted', 'job_accepted', 'job_completed', 'payment_received', 'job_expired')), related_job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*- Indexes*
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
*- ============================================- MATERIALIZED VIEW: Analytics- ============================================*
CREATE MATERIALIZED VIEW job_analytics AS
SELECT job_type, COUNT(*) as total_jobs, COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs, AVG(pay_amount_usd) as avg_pay, SUM(pay_amount_usd) FILTER (WHERE status = 'completed') as total_value, AVG(EXTRACT(EPOCH FROM (completed_at - accepted_at))/3600) as avg_completion_hours
FROM jobs
GROUP BY job_type;
CREATE UNIQUE INDEX idx_job_analytics_type ON job_analytics(job_type);
*- Refresh periodically (manual or cron)- REFRESH MATERIALIZED VIEW job_analytics;- ============================================- FUNCTIONS & TRIGGERS- ============================================- Update timestamp trigger*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*- Auto-calculate deadline on job acceptance*
CREATE OR REPLACE FUNCTION calculate_job_deadline()
RETURNS TRIGGER AS $$
BEGIN IF NEW.status = 'in_progress' AND OLD.status = 'open' THEN NEW.deadline = NEW.accepted_at + (NEW.time_limit_hours || ' hours')::INTERVAL; END IF; RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER set_job_deadline BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION calculate_job_deadline();`

### **Seed Data (Demo Accounts)**

sql

- `*- ============================================- SEED DATA: Demo Users- ============================================- Employers*
INSERT INTO users (username, email, wallet_address, wallet_address_hash, user_type) VALUES
('TechStartupCo', 'ceo@techstartup.com', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', encode(digest('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 'sha256'), 'hex'), 'employer'),
('DesignAgency', 'hire@designagency.com', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', encode(digest('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 'sha256'), 'hex'), 'employer');
*- Workers*
INSERT INTO users (username, email, wallet_address, wallet_address_hash, user_type) VALUES
('AliceDev', 'alice@developers.io', '0x90F79bf6EB2c4f870365E785982E1f101E93b906', encode(digest('0x90F79bf6EB2c4f870365E785982E1f101E93b906', 'sha256'), 'hex'), 'worker'),
('BobDesigner', 'bob@creative.com', '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', encode(digest('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 'sha256'), 'hex'), 'worker'),
('CarolWriter', 'carol@wordsmith.io', '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', encode(digest('0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', 'sha256'), 'hex'), 'worker');
*- ============================================- SEED DATA: Sample Jobs- ============================================*
INSERT INTO jobs ( employer_id, title, description, job_type, pay_amount_usd, pay_amount_eth, platform_fee_usd, platform_fee_eth, time_limit_hours, checklist, status
) VALUES
(1, 'Build React E-commerce Dashboard', 'Create a full-featured admin dashboard with product management, order tracking, and real-time analytics. Must be responsive and use modern React patterns.', 'development', 5000.00, 1.219512, 100.00, 0.024390, 120, '[ {"id": 1, "text": "Setup project structure with Vite", "completed": false}, {"id": 2, "text": "Implement authentication system", "completed": false}, {"id": 3, "text": "Build product CRUD interface", "completed": false}, {"id": 4, "text": "Create analytics dashboard with charts", "completed": false}, {"id": 5, "text": "Deploy to production", "completed": false} ]'::jsonb, 'open'),
(1, 'WordPress Security Audit', 'Comprehensive security review and hardening of WordPress site. Must include vulnerability scan, plugin review, and implementation of security best practices.', 'development', 800.00, 0.195122, 16.00, 0.003902, 24, '[ {"id": 1, "text": "Run security scan and generate report", "completed": false}, {"id": 2, "text": "Fix identified vulnerabilities", "completed": false}, {"id": 3, "text": "Install and configure security plugins", "completed": false}, {"id": 4, "text": "Document all changes made", "completed": false} ]'::jsonb, 'open'),
(2, 'Mobile Banking App UI Design', 'Modern, clean UI/UX design for iOS and Android banking application. Must include wireframes, high-fidelity mockups, and interactive prototype.', 'design', 2500.00, 0.609756, 50.00, 0.012195, 72, '[ {"id": 1, "text": "Create wireframes for key screens", "completed": false}, {"id": 2, "text": "Design high-fidelity mockups", "completed": false}, {"id": 3, "text": "Build design system documentation", "completed": false}, {"id": 4, "text": "Create interactive prototype in Figma", "completed": false} ]'::jsonb, 'open'),
(2, 'Corporate Branding Package', 'Complete branding package including logo design, color palette, typography guidelines, and brand style guide. Must provide multiple logo variations.', 'design', 2000.00, 0.487805, 40.00, 0.009756, 96, '[ {"id": 1, "text": "Initial concepts (3 options)", "completed": false}, {"id": 2, "text": "Revisions on selected concept", "completed": false}, {"id": 3, "text": "Final logo in all formats", "completed": false}, {"id": 4, "text": "Complete brand guidelines document", "completed": false} ]'::jsonb, 'open'),
(1, 'Technical Blog Post Series', 'Write 5 detailed technical articles about microservices architecture. Each article should be 2000+ words with code examples and diagrams.', 'writing', 1500.00, 0.365854, 30.00, 0.007317, 168, '[ {"id": 1, "text": "Research topics and create outlines", "completed": false}, {"id": 2, "text": "Write first drafts of all 5 articles", "completed": false}, {"id": 3, "text": "Revisions based on feedback", "completed": false}, {"id": 4, "text": "Final submission with images and code", "completed": false} ]'::jsonb, 'open');
```
---
## **4. MICROSERVICES DESIGN**
### **A. User Service (:8001)**
**Responsibilities:**
- User registration and authentication
- MetaMask wallet verification
- JWT token issuance and validation
- User profile management
- Session management
**Endpoints:**
```
POST /auth/challenge Generate signature challenge
POST /auth/verify Verify MetaMask signature & issue JWT
POST /auth/refresh Refresh access token
POST /auth/logout Revoke tokens
GET /users/me Get current user profile
GET /users/{user_id} Get user by ID (public info)
PUT /users/me Update profile
GET /users/balance/{wallet} Get wallet balance from blockchain
```
**Database Tables:**
- users
- sessions
**Dependencies:**
- PostgreSQL
- No external service calls
---
### **B. Job Service (:8002)**
**Responsibilities:**
- Job CRUD operations
- Job filtering and search
- Worker job acceptance
- Checklist management
- Job completion submission
- Job expiration checking
**Endpoints:**
```
POST /jobs Create new job (employer only)
GET /jobs List jobs with filters
GET /jobs/{job_id} Get job details
PUT /jobs/{job_id} Update job (employer only)
DELETE /jobs/{job_id} Cancel job (employer only)
PUT /jobs/{job_id}/accept Worker accepts job
PUT /jobs/{job_id}/checklist Update checklist progress
POST /jobs/{job_id}/complete Submit job completion
GET /jobs/my-jobs Get user's jobs (employer or worker)
GET /jobs/analytics Get job statistics
Internal Endpoints (Service-to-Service only):
POST /internal/jobs/expire Mark expired jobs (called by cron)
POST /internal/jobs/update-status Update job status from Payment Service
```
**Database Tables:**
- jobs
**External Service Calls:**
- User Service: Verify user exists and get wallet address
- Payment Service: Lock funds, release payment
- WebSocket Server: Broadcast job updates
---
### **C. Payment Service (:8003)**
**Responsibilities:**
- Smart contract interaction
- Escrow fund locking
- Payment release
- Transaction tracking
- Blockchain synchronization
- Balance queries
**Endpoints:**
```
POST /escrow/lock Lock funds in smart contract
POST /escrow/release Release payment to worker
POST /escrow/refund Refund employer (expired job)
GET /escrow/balance/{job_id} Get locked amount for job
GET /transactions List transactions (with filters)
GET /transactions/{tx_hash} Get transaction details
GET /balance/{wallet} Get wallet balance
Internal Endpoints:
POST /internal/sync-blockchain Sync blockchain transactions
GET /internal/health/ganache Check Ganache connection
```
**Database Tables:**
- transactions
**External Service Calls:**
- Job Service: Update job payment status
- Ganache: All blockchain operations
- WebSocket Server: Broadcast payment events
---
### **D. API Gateway (:8000)**
**Responsibilities:**
- Request routing to appropriate service
- JWT authentication middleware
- Rate limiting
- Request/response logging
- CORS handling
- Service health checks
**Routes:**
```
/auth/* → User Service
/users/* → User Service
/jobs/* → Job Service
/escrow/* → Payment Service
/transactions/* → Payment Service
/ws → WebSocket Server
```
**Middleware Chain:**
```
Request → CORS Check → Rate Limit → JWT Validation → Route to Service → Response`

**No Database Access** - Pure routing layer

---

### **E. WebSocket Server (:8080)**

**Responsibilities:**

- Real-time updates to connected clients
- Event broadcasting
- Connection management
- User subscription management

**Events Published:**

javascript

`*// Client → Server*
{
  "type": "subscribe",
  "channels": ["jobs", "user:{user_id}"]
}

*// Server → Client*
{
  "type": "job_created",
  "data": { job object }
}

{
  "type": "job_accepted",
  "data": { job_id, worker_id }
}

{
  "type": "job_completed",
  "data": { job_id, payment_released }
}

{
  "type": "payment_received",
  "data": { transaction object }
}

{
  "type": "notification",
  "data": { title, message, type }
}`

**No Database Access** - Receives events from services via HTTP POST

---

## **5. SMART CONTRACT**

### **PayChainEscrow.sol**

solidity

`*// SPDX-License-Identifier: MIT*
pragma solidity ^0.8.20;

*/***
 * @title PayChainEscrow
 * @dev Escrow contract for gig economy platform
 * @notice Holds funds in escrow until job completion
 **/*
contract PayChainEscrow {
    
    *// ============================================// STATE VARIABLES// ============================================*
    
    address public owner;  *// Platform address*
    uint256 public platformFeePercent = 2; *// 2% platform fee*
    uint256 public totalEscrowLocked;
    uint256 public totalFeesCollected;
    
    struct Job {
        uint256 jobId;
        address payable employer;
        address payable worker;
        uint256 amount;           *// Total amount locked (including fee)*
        uint256 workerAmount;     *// Amount worker receives*
        uint256 platformFee;      *// Platform fee*
        uint256 deadline;         *// Unix timestamp*
        bool isLocked;
        bool isCompleted;
        bool isRefunded;
        uint256 createdAt;
    }
    
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256) public employerJobCount;
    mapping(address => uint256) public workerJobCount;
    
    *// ============================================// EVENTS// ============================================*
    
    event JobCreated(
        uint256 indexed jobId,
        address indexed employer,
        uint256 totalAmount,
        uint256 workerAmount,
        uint256 platformFee,
        uint256 deadline
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        address indexed worker,
        uint256 amount,
        uint256 platformFee
    );
    
    event JobRefunded(
        uint256 indexed jobId,
        address indexed employer,
        uint256 amount
    );
    
    event PlatformFeeWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    *// ============================================// MODIFIERS// ============================================*
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(jobs[_jobId].employer != address(0), "Job does not exist");
        _;
    }
    
    *// ============================================// CONSTRUCTOR// ============================================*
    
    constructor() {
        owner = msg.sender;
    }
    
    *// ============================================// MAIN FUNCTIONS// ============================================*
    
    */***
     * @dev Create new job and lock funds in escrow
     * @param _jobId Unique job identifier from database
     * @param _timeLimitHours Number of hours to complete job
     **/*
    function createJob(uint256 _jobId, uint256 _timeLimitHours) 
        external 
        payable 
    {
        require(msg.value > 0, "Must send ETH");
        require`

Retry

Claude does not have the ability to run the code it generates yet.

S

Continue

solidity

        `require(jobs[_jobId].employer == address(0), "Job ID already exists");
        require(_timeLimitHours > 0, "Time limit must be positive");
        
        *// Calculate amounts*
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 workerAmount = msg.value - platformFee;
        
        *// Create job*
        jobs[_jobId] = Job({
            jobId: _jobId,
            employer: payable(msg.sender),
            worker: payable(address(0)),
            amount: msg.value,
            workerAmount: workerAmount,
            platformFee: platformFee,
            deadline: block.timestamp + (_timeLimitHours * 1 hours),
            isLocked: true,
            isCompleted: false,
            isRefunded: false,
            createdAt: block.timestamp
        });
        
        totalEscrowLocked += msg.value;
        employerJobCount[msg.sender]++;
        
        emit JobCreated(
            _jobId,
            msg.sender,
            msg.value,
            workerAmount,
            platformFee,
            jobs[_jobId].deadline
        );
    }
    
    */***
     * @dev Release payment to worker upon job completion
     * @param _jobId Job identifier
     * @param _worker Worker's address
     **/*
    function releasePayment(uint256 _jobId, address payable _worker) 
        external 
        onlyOwner 
        jobExists(_jobId) 
    {
        Job storage job = jobs[_jobId];
        
        require(job.isLocked, "Job is not locked");
        require(!job.isCompleted, "Job already completed");
        require(!job.isRefunded, "Job already refunded");
        require(_worker != address(0), "Invalid worker address");
        require(block.timestamp <= job.deadline, "Job expired");
        
        *// Update state*
        job.worker = _worker;
        job.isCompleted = true;
        job.isLocked = false;
        
        totalEscrowLocked -= job.amount;
        totalFeesCollected += job.platformFee;
        workerJobCount[_worker]++;
        
        *// Transfer funds*
        _worker.transfer(job.workerAmount);
        
        emit PaymentReleased(_jobId, _worker, job.workerAmount, job.platformFee);
    }
    
    */***
     * @dev Refund employer if job expired without completion
     * @param _jobId Job identifier
     **/*
    function refundExpiredJob(uint256 _jobId) 
        external 
        jobExists(_jobId) 
    {
        Job storage job = jobs[_jobId];
        
        require(job.isLocked, "Job is not locked");
        require(!job.isCompleted, "Job already completed");
        require(!job.isRefunded, "Job already refunded");
        require(block.timestamp > job.deadline, "Job not expired yet");
        
        *// Update state*
        job.isRefunded = true;
        job.isLocked = false;
        
        totalEscrowLocked -= job.amount;
        
        *// Refund full amount (including platform fee since job wasn't completed)*
        job.employer.transfer(job.amount);
        
        emit JobRefunded(_jobId, job.employer, job.amount);
    }
    
    */***
     * @dev Platform owner withdraws collected fees
     **/*
    function withdrawPlatformFees() 
        external 
        onlyOwner 
    {
        require(totalFeesCollected > 0, "No fees to withdraw");
        
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        payable(owner).transfer(amount);
        
        emit PlatformFeeWithdrawn(owner, amount);
    }
    
    *// ============================================// VIEW FUNCTIONS// ============================================*
    
    */***
     * @dev Get job details
     **/*
    function getJob(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (Job memory) 
    {
        return jobs[_jobId];
    }
    
    */***
     * @dev Get locked balance for specific job
     **/*
    function getJobBalance(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (uint256) 
    {
        return jobs[_jobId].isLocked ? jobs[_jobId].amount : 0;
    }
    
    */***
     * @dev Check if job has expired
     **/*
    function isJobExpired(uint256 _jobId) 
        external 
        view 
        jobExists(_jobId) 
        returns (bool) 
    {
        return block.timestamp > jobs[_jobId].deadline;
    }
    
    */***
     * @dev Get contract stats
     **/*
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalEscrowLocked,
            uint256 _totalFeesCollected,
            uint256 _contractBalance
        ) 
    {
        return (
            totalEscrowLocked,
            totalFeesCollected,
            address(this).balance
        );
    }
    
    *// ============================================// EMERGENCY FUNCTIONS// ============================================*
    
    */***
     * @dev Emergency pause (for critical bugs)
     * @notice In production, use OpenZeppelin's Pausable
     **/*
    bool public paused = false;
    
    function togglePause() external onlyOwner {
        paused = !paused;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
}`

### **Contract Deployment Script**

javascript

`*// deploy-contract.js*
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying PayChainEscrow with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    const PayChainEscrow = await ethers.getContractFactory("PayChainEscrow");
    const escrow = await PayChainEscrow.deploy();
    
    await escrow.deployed();
    
    console.log("PayChainEscrow deployed to:", escrow.address);
    
    *// Save contract address to .env*
    const fs = require('fs');
    fs.appendFileSync('.env', `\nCONTRACT_ADDRESS=${escrow.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## **6. FRONTEND ARCHITECTURE**

### **Directory Structure**
```
frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Root component
│   ├── index.css                   # Global styles (Tailwind)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── ConnectWallet.jsx
│   │   │   └── LoginModal.jsx
│   │   │
│   │   ├── jobs/
│   │   │   ├── JobCard.jsx
│   │   │   ├── JobList.jsx
│   │   │   ├── JobDetails.jsx
│   │   │   ├── CreateJobForm.jsx
│   │   │   ├── JobFilters.jsx
│   │   │   └── ChecklistManager.jsx
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletBalance.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   └── TransactionModal.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── EmployerDashboard.jsx
│   │   │   ├── WorkerDashboard.jsx
│   │   │   └── StatsCard.jsx
│   │   │
│   │   ├── shared/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── ProgressBar.jsx
│   │   │
│   │   └── dev/
│   │       └── DevTools.jsx         # Hidden panel (Ctrl+Shift+D)
│   │
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── BrowseJobsPage.jsx
│   │   ├── JobDetailsPage.jsx
│   │   ├── CreateJobPage.jsx
│   │   ├── MyJobsPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx          # User authentication state
│   │   ├── WalletContext.jsx        # MetaMask connection
│   │   └── WebSocketContext.jsx     # Real-time updates
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useMetaMask.js
│   │   ├── useJobs.js
│   │   ├── useTransactions.js
│   │   ├── useWebSocket.js
│   │   └── useDevTools.js
│   │
│   ├── services/
│   │   ├── api.js                   # Axios instance
│   │   ├── authService.js
│   │   ├── jobService.js
│   │   ├── paymentService.js
│   │   └── blockchainService.js     # ethers.js wrapper
│   │
│   ├── utils/
│   │   ├── formatters.js            # Date, currency, address formatting
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── helpers.js
│   │
│   └── config/
│       └── index.js                 # Environment variables
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example`

### **Key React Patterns to Showcase**

**1. Custom Hooks**

javascript

`*// hooks/useJobs.js*
- useQuery for fetching
- useMutation for create/update/delete
- Optimistic updates
- Error handling
- Loading states`

**2. Context API**

javascript

`*// AuthContext: User session, logout, token refresh// WalletContext: MetaMask connection, balance, network// WebSocketContext: Real-time event subscriptions*`

**3. Component Composition**

javascript

`*// Compound components pattern*
<JobCard>
  <JobCard.Header />
  <JobCard.Body />
  <JobCard.Footer />
</JobCard>`

**4. Performance Optimization**

javascript

- `React.memo for expensive components
- useMemo for calculations
- useCallback for event handlers
- Code splitting with React.lazy()
```
---
## **7. AUTHENTICATION & AUTHORIZATION**
### **Authentication Flow (MetaMask Signature)**
```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Clicks "Connect Wallet" │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Frontend → Check if MetaMask installed │
│ → Request account access │
│ → Get wallet address: 0xABC... │
│ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Request Challenge from Backend │
├─────────────────────────────────────────────────────────────────┤
│ │
│ POST /auth/challenge │
│ Body: { "wallet_address": "0xABC..." } │
│ │
│ Response: │
│ { │
│ "challenge": "Sign this to login to PayChain\n │
│ Wallet: 0xABC...\n │
│ Nonce: 7a8b9c...\n │
│ Timestamp: 1698765432" │
│ } │
│ │
│ Backend: Generate nonce, store in Redis (5-min expiry) │
│ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: User Signs Message with MetaMask │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Frontend → Call ethereum.request({ │
│ method: 'personal_sign', │
│ params: [challenge, walletAddress] │
│ }) │
│ → MetaMask popup appears │
│ → User clicks "Sign" │
│ → Get signature: "0x1a2b3c..." │
│ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Verify Signature & Issue JWT │
├─────────────────────────────────────────────────────────────────┤
│ │
│ POST /auth/verify │
│ Body: { │
│ "wallet_address": "0xABC...", │
│ "signature": "0x1a2b3c...", │
│ "message": "Sign this to login..." │
│ } │
│ │
│ Backend: │
│ 1. Retrieve nonce from Redis │
│ 2. Recover signer address from signature │
│ 3. Verify signer == wallet_address │
│ 4. Check if user exists in database │
│ - YES: Login existing user │
│ - NO: Return "needs_signup: true" │
│ 5. Generate JWT tokens (access + refresh) │
│ 6. Delete nonce from Redis (prevent reuse) │
│ │
│ Response: │
│ { │
│ "access_token": "eyJhbGc...", │
│ "refresh_token": "eyJhbGc...", │
│ "token_type": "bearer", │
│ "expires_in": 1800, │
│ "user": { │
│ "id": 1, │
│ "username": "AliceDev", │
│ "email": "alice@dev.com", │
│ "wallet_address": "0xABC...", │
│ "user_type": "worker" │
│ } │
│ } │
│ │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Store Tokens & Redirect │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Frontend: │
│ - Store access_token in memory (React state) │
│ - Store refresh_token in httpOnly cookie (more secure) │
│ - Set Authorization header for all API requests │
│ - Redirect to dashboard │
│ │
└─────────────────────────────────────────────────────────────────┘`

### **JWT Token Structure**

javascript

`*// Access Token (30 minutes)*
{
  "sub": "1",                    *// User ID*
  "wallet": "0xABC...",          *// Wallet address*
  "user_type": "worker",         *// employer | worker*
  "type": "access",
  "iat": 1698765432,             *// Issued at*
  "exp": 1698767232,             *// Expires at (30 min)*
  "jti": "a7b8c9d0e1f2..."      *// Unique token ID*
}

*// Refresh Token (7 days)*
{
  "sub": "1",
  "type": "refresh",
  "iat": 1698765432,
  "exp": 1699370232,             *// Expires at (7 days)*
  "jti": "f6e5d4c3b2a1..."
}`

### **Authorization Middleware**

python

`*# API Gateway: auth_middleware.py*

def require_auth(required_role: Optional[str] = None):
    """
    Decorator for protected endpoints
    
    Usage:
        @app.get("/jobs")
        @require_auth()  # Any authenticated user
        
        @app.post("/jobs")
        @require_auth(role="employer")  # Only employers
    """
    async def verify_token(
        authorization: str = Header(None)
    ):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "Missing or invalid token")
        
        token = authorization.split(" ")[1]
        
        try:
            *# Decode JWT*
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            
            *# Check if token is revoked (check sessions table)*
            is_revoked = await check_token_revoked(payload["jti"])
            if is_revoked:
                raise HTTPException(401, "Token has been revoked")
            
            *# Check required role*
            if required_role and payload.get("user_type") != required_role:
                raise HTTPException(
                    403, 
                    f"Access denied. {required_role} role required"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(401, "Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(401, "Invalid token")
    
    return verify_token
```

*### **Sign Out Flow***
```
User Clicks "Sign Out"
    ↓
Frontend:
  - Clear tokens from state/cookies
  - Disconnect MetaMask (optional)
    ↓
Backend: POST /auth/logout
  - Decode JWT to get jti
  - Mark session as revoked in database
  - Add jti to Redis blacklist (for faster checks)
    ↓
Response: { "message": "Logged out successfully" }
    ↓
Frontend:
  - Redirect to landing page
  - Show success toast`

---

## **8. API SPECIFICATIONS**

### **Complete API Endpoints**

### **Authentication APIs**

yaml

`POST /auth/challenge
  Description: Generate signature challenge for MetaMask
  Body:
    wallet_address: string (required)
  Response:
    challenge: string
    expires_in: number (seconds)
  Status Codes:
    200: Success
    400: Invalid wallet address

POST /auth/verify
  Description: Verify signature and issue JWT
  Body:
    wallet_address: string (required)
    signature: string (required)
    message: string (required)
  Response:
    access_token: string
    refresh_token: string
    token_type: "bearer"
    expires_in: number
    user: object
    needs_signup: boolean (if new user)
  Status Codes:
    200: Success
    400: Invalid signature
    401: Verification failed

POST /auth/signup
  Description: Complete new user registration
  Headers:
    Authorization: Bearer <token from verify>
  Body:
    username: string (required, 3-50 chars)
    email: string (required, valid email)
    user_type: "employer" | "worker" (required)
  Response:
    user: object
  Status Codes:
    201: Created
    400: Validation error
    409: Username/email already exists

POST /auth/refresh
  Description: Refresh access token using refresh token
  Body:
    refresh_token: string (required)
  Response:
    access_token: string
    expires_in: number
  Status Codes:
    200: Success
    401: Invalid or expired refresh token

POST /auth/logout
  Description: Revoke current session
  Headers:
    Authorization: Bearer <token>
  Response:
    message: string
  Status Codes:
    200: Success
    401: Unauthorized`

### **User APIs**

yaml

`GET /users/me
  Description: Get current user profile
  Headers:
    Authorization: Bearer <token>
  Response:
    id: number
    username: string
    email: string
    wallet_address: string
    user_type: string
    created_at: string (ISO 8601)
  Status Codes:
    200: Success
    401: Unauthorized

PUT /users/me
  Description: Update user profile
  Headers:
    Authorization: Bearer <token>
  Body:
    username: string (optional)
    email: string (optional)
  Response:
    user: object
  Status Codes:
    200: Success
    400: Validation error
    401: Unauthorized
    409: Username/email taken

GET /users/{user_id}
  Description: Get public user profile
  Response:
    id: number
    username: string
    user_type: string
    jobs_completed: number
    average_rating: number (future feature)
  Status Codes:
    200: Success
    404: User not found

GET /balance/{wallet_address}
  Description: Get wallet balance from blockchain
  Response:
    wallet_address: string
    balance_eth: string
    balance_usd: string
    last_updated: string
  Status Codes:
    200: Success
    400: Invalid wallet address`

### **Job APIs**

yaml

`POST /jobs
  Description: Create new job (employer only)
  Headers:
    Authorization: Bearer <token>
  Body:
    title: string (required, 5-200 chars)
    description: string (required, 20-5000 chars)
    job_type: enum (required) ["development", "design", "writing", "marketing", "other"]
    pay_amount_usd: number (required, 10-50000)
    time_limit_hours: number (required, 1-720)
    checklist: array of strings (required, 1-20 items)
  Response:
    job: object (includes contract_address)
    transaction_hash: string
  Status Codes:
    201: Created
    400: Validation error
    401: Unauthorized
    402: Insufficient balance
    403: Not an employer
    503: Blockchain unavailable

GET /jobs
  Description: List jobs with filters
  Query Parameters:
    status: string (optional) ["open", "in_progress", "completed"]
    job_type: string (optional)
    min_pay: number (optional)
    max_pay: number (optional)
    employer_id: number (optional)
    worker_id: number (optional)
    search: string (optional)
    sort_by: string (optional) ["newest", "pay_high", "pay_low", "deadline"]
    page: number (optional, default: 1)
    limit: number (optional, default: 20, max: 100)
  Response:
    jobs: array
    total: number
    page: number
    pages: number
  Status Codes:
    200: Success

GET /jobs/{job_id}
  Description: Get job details
  Response:
    id: number
    title: string
    description: string
    employer: object (id, username, wallet)
    worker: object | null
    pay_amount_usd: number
    pay_amount_eth: number
    platform_fee_usd: number
    time_limit_hours: number
    deadline: string | null
    checklist: array
    contract_address: string
    status: string
    payment_status: string
    created_at: string
    accepted_at: string | null
    completed_at: string | null
  Status Codes:
    200: Success
    404: Job not found

PUT /jobs/{job_id}/accept
  Description: Worker accepts job
  Headers:
    Authorization: Bearer <token>
  Response:
    job: object
    message: string
  Status Codes:
    200: Success
    400: Job not available
    401: Unauthorized
    403: Not a worker
    409: Job already taken

PUT /jobs/{job_id}/checklist
  Description: Update checklist item
  Headers:
    Authorization: Bearer <token>
  Body:
    item_id: number (required)
    completed: boolean (required)
  Response:
    checklist: array
    progress_percent: number
  Status Codes:
    200: Success
    401: Unauthorized
    403: Not assigned to this job
    404: Job not found

POST /jobs/{job_id}/complete
  Description: Submit job completion
  Headers:
    Authorization: Bearer <token>
  Response:
    job: object
    transaction: object
    message: string
  Status Codes:
    200: Success
    400: Checklist not complete
    401: Unauthorized
    403: Not assigned to this job
    404: Job not found
    503: Payment service unavailable

DELETE /jobs/{job_id}
  Description: Cancel job (employer only, only if not accepted)
  Headers:
    Authorization: Bearer <token>
  Response:
    message: string
    refund_transaction: object
  Status Codes:
    200: Success
    400: Job already accepted
    401: Unauthorized
    403: Not job owner
    404: Job not found

GET /jobs/my-jobs
  Description: Get current user's jobs
  Headers:
    Authorization: Bearer <token>
  Query Parameters:
    role: string (optional) ["employer", "worker"]
    status: string (optional)
  Response:
    jobs: array
    stats: object
  Status Codes:
    200: Success
    401: Unauthorized`

### **Payment/Escrow APIs**

yaml

`POST /escrow/lock
  Description: Lock funds in smart contract (internal service call)
  Headers:
    X-Service-API-Key: <service_key>
  Body:
    job_id: number (required)
    employer_wallet: string (required)
    amount_eth: string (required)
    time_limit_hours: number (required)
  Response:
    transaction_hash: string
    contract_address: string
    gas_used: number
  Status Codes:
    200: Success
    400: Invalid parameters
    401: Unauthorized service
    503: Blockchain unavailable

POST /escrow/release
  Description: Release payment to worker (internal service call)
  Headers:
    X-Service-API-Key: <service_key>
  Body:
    job_id: number (required)
    worker_wallet: string (required)
  Response:
    transaction_hash: string
    amount_sent: string
    platform_fee: string
  Status Codes:
    200: Success
    400: Invalid parameters
    401: Unauthorized service
    404: Job not found in contract
    503: Blockchain unavailable

POST /escrow/refund
  Description: Refund expired job (can be called by cron or user)
  Headers:
    X-Service-API-Key: <service_key> OR Authorization: Bearer <token>
  Body:
    job_id: number (required)
  Response:
    transaction_hash: string
    refund_amount: string
  Status Codes:
    200: Success
    400: Job not expired
    404: Job not found
    503: Blockchain unavailable

GET /transactions
  Description: List transactions with filters
  Headers:
    Authorization: Bearer <token>
  Query Parameters:
    wallet_address: string (optional)
    job_id: number (optional)
    type: string (optional) ["escrow_lock", "payment_release", "refund"]
    status: string (optional) ["pending", "confirmed", "failed"]
    page: number (optional)
    limit: number (optional)
  Response:
    transactions: array
    total: number
  Status Codes:
    200: Success
    401: Unauthorized

GET /transactions/{tx_hash}
  Description: Get transaction details
  Response:
    id: number
    job_id: number
    from_wallet: string
    to_wallet: string
    amount_eth: string
    amount_usd: string
    tx_hash: string
    block_number: number
    gas_used: number
    transaction_type: string
    status: string
    created_at: string
    confirmed_at: string
  Status Codes:
    200: Success
    404: Transaction not found`

---

## **9. REAL-TIME FEATURES**

### **WebSocket Events**

javascript

`*// ============================================// CLIENT → SERVER (Subscriptions)// ============================================*

{
  "type": "subscribe",
  "channels": ["jobs", "user:123", "notifications"]
}

{
  "type": "unsubscribe",
  "channels": ["jobs"]
}

{
  "type": "ping"
}

*// ============================================// SERVER → CLIENT (Events)// ============================================// New job posted*
{
  "type": "job_created",
  "data": {
    "job_id": 42,
    "title": "Build React Dashboard",
    "pay_amount_usd": 2000,
    "job_type": "development",
    "employer": {
      "id": 1,
      "username": "TechStartupCo"
    }
  },
  "timestamp": "2025-10-28T10:00:00Z"
}

*// Job accepted*
{
  "type": "job_accepted",
  "data": {
    "job_id": 42,
    "worker": {
      "id": 3,
      "username": "AliceDev"
    }
  },
  "timestamp": "2025-10-28T10:05:00Z"
}

*// Job completed*
{
  "type": "job_completed",
  "data": {
    "job_id": 42,
    "payment_released": true,
    "transaction_hash": "0x1a2b3c..."
  },
  "timestamp": "2025-10-28T12:00:00Z"
}

*// Payment received*
{
  "type": "payment_received",
  "data": {
    "job_id": 42,
    "amount_usd": 2000,
    "amount_eth": "0.487805",
    "transaction_hash": "0x1a2b3c..."
  },
  "timestamp": "2025-10-28T12:00:05Z"
}

*// Generic notification*
{
  "type": "notification",
  "data": {
    "title": "Job Deadline Approaching",
    "message": "Your job 'Build React Dashboard' is due in 2 hours",
    "notification_type": "warning",
    "related_job_id": 42
  },
  "timestamp": "2025-10-28T10:00:00Z"
}

*// Pong response*
{
  "type": "pong",
  "timestamp": "2025-10-28T10:00:00Z"`

`}

// ============================================
// ERROR EVENTS
// ============================================

{
  "type": "error",
  "error": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "Invalid channel name"
  },
  "timestamp": "2025-10-28T10:00:00Z"
}

{
  "type": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required for this channel"
  },
  "timestamp": "2025-10-28T10:00:00Z"
}
```

---

*## **10. DEVELOPER TOOLS (Hidden Features)**### **Dev Panel Features (Ctrl+Shift+D)***
```
┌─────────────────────────────────────────────────────────────────┐
│                     🛠️ DEV TOOLS PANEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  QUICK USER SWITCH (No Re-login Required)              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  👨‍💼 TechStartupCo (Employer)    Balance: $102,500    │   │
│  │     0x7099...79C8                         [SWITCH]     │   │
│  │                                                         │   │
│  │  🎨 DesignAgency (Employer)       Balance: $61,500     │   │
│  │     0x3C44...93BC                         [SWITCH]     │   │
│  │                                                         │   │
│  │  👩‍💻 AliceDev (Worker)            Balance: $8,200      │   │
│  │     0x90F7...b906                         [SWITCH]     │   │
│  │                                                         │   │
│  │  🎨 BobDesigner (Worker)          Balance: $8,200      │   │
│  │     0x15d3...6A65                         [SWITCH]     │   │
│  │                                                         │   │
│  │  ✍️ CarolWriter (Worker)          Balance: $8,200      │   │
│  │     0x9965...A4dc                         [SWITCH]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TIME MANIPULATION                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  Fast-Forward Time: [+1h] [+6h] [+24h] [+48h]         │   │
│  │                                                         │   │
│  │  Current Demo Time: 2025-10-28 10:00:00 UTC           │   │
│  │  Real Time Offset:  +0 hours                           │   │
│  │                     [RESET TIME]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SCENARIO TRIGGERS                                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  [Create Sample Job]      Quick job with preset data   │   │
│  │  [Accept Job Instantly]   Auto-accept as current worker│   │
│  │  [Complete All Tasks]     Mark all checklist complete  │   │
│  │  [Trigger Payment]        Force payment release        │   │
│  │  [Expire Job]             Fast-forward to deadline     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SYSTEM STATE                                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  API Gateway:      🟢 Online  (8000)                   │   │
│  │  User Service:     🟢 Online  (8001)                   │   │
│  │  Job Service:      🟢 Online  (8002)                   │   │
│  │  Payment Service:  🟢 Online  (8003)                   │   │
│  │  PostgreSQL:       🟢 Connected                         │   │
│  │  Ganache:          🟢 Connected  (Block: 42)           │   │
│  │  WebSocket:        🟢 Connected                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DEMO RESET                                             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ⚠️  This will reset ALL data to initial state         │   │
│  │                                                         │   │
│  │  [RESET DATABASE]  [RESET BLOCKCHAIN]  [FULL RESET]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DEBUG CONSOLE                                          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  [10:00:01] User switched to AliceDev                  │   │
│  │  [10:00:05] WebSocket connected                        │   │
│  │  [10:00:10] Job *#42 created (tx: 0x1a2b...)           │   │*
│  │  [10:00:15] Job *#42 accepted by AliceDev              │   │*
│  │                                    [CLEAR] [EXPORT]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [CLOSE DEV TOOLS]                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`

### **Dev Tools Backend API**

yaml

`POST /dev/switch-user
  Description: Switch to different demo user (dev only)
  Headers:
    X-Dev-Mode: true
  Body:
    user_id: number
  Response:
    access_token: string
    user: object
  Status: 200 (only works if ENVIRONMENT=development)

POST /dev/fast-forward-time
  Description: Simulate time passing
  Headers:
    X-Dev-Mode: true
  Body:
    hours: number
  Response:
    new_demo_time: string
    affected_jobs: array
  Status: 200

POST /dev/reset-demo
  Description: Reset database and blockchain to initial state
  Headers:
    X-Dev-Mode: true
  Body:
    reset_database: boolean
    reset_blockchain: boolean
  Response:
    message: string
    reset_time: string
  Status: 200

GET /dev/system-health
  Description: Get all services health status
  Headers:
    X-Dev-Mode: true
  Response:
    services: object
    database: object
    blockchain: object
  Status: 200
```

---

*## **11. USER FLOWS**### **Complete Demo Flow (10 Minutes)***
```
┌─────────────────────────────────────────────────────────────────┐
│ PREPARATION (30 seconds before demo)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Start all services: docker-compose up -d                    │
│ 2. Verify all services healthy: curl localhost:8000/health     │
│ 3. Open browser: http://localhost:5173                         │
│ 4. Open terminal: docker-compose logs -f (show service logs)   │
│ 5. Open Ganache UI: http://localhost:8545                      │
│ 6. Open DBeaver: Connect to PostgreSQL                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACT 1: EMPLOYER CREATES JOB (2 minutes)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Press Ctrl+Shift+D → Dev Tools opens                        │
│ 2. Click "TechStartupCo (Employer)" → Auto-login               │
│                                                                 │
│ 3. Dashboard loads:                                             │
│    - Balance: $102,500 (25 ETH)                                │
│    - Active Jobs: 0                                             │
│    - Big "Create Job" button                                    │
│                                                                 │
│ 4. Click "Create Job" → Multi-step form appears:               │
│                                                                 │
│    STEP 1: Job Details                                          │
│    - Title: "Build React Dashboard"                            │
│    - Description: "Create admin dashboard with..."             │
│    - Job Type: Development                                      │
│    - [NEXT]                                                     │
│                                                                 │
│    STEP 2: Payment                                              │
│    - Pay Amount: $2,000                                         │
│    - Shows conversion: 0.487805 ETH                            │
│    - Time Limit: 48 hours                                       │
│    - Platform Fee: $40 (2%)                                     │
│    - Total to Lock: $2,040                                      │
│    - [NEXT]                                                     │
│                                                                 │
│    STEP 3: Checklist                                            │
│    - ✅ Setup project structure                                │
│    - ✅ Build authentication                                    │
│    - ✅ Create CRUD interfaces                                 │
│    - ✅ Add analytics dashboard                                │
│    - ✅ Deploy to production                                   │
│    - [NEXT]                                                     │
│                                                                 │
│    STEP 4: Review & Confirm                                     │
│    - Shows summary of everything                                │
│    - [CREATE JOB & LOCK FUNDS]                                 │
│                                                                 │
│ 5. MetaMask popup appears:                                      │
│    - Transaction details shown                                  │
│    - Amount: 0.497561 ETH ($2,040)                             │
│    - Gas Fee: ~0.0001 ETH                                       │
│    - [CONFIRM]                                                  │
│                                                                 │
│ 6. Loading spinner: "Locking funds in escrow..."               │
│                                                                 │
│ 7. Success! 🎉                                                  │
│    - Toast notification: "Job created successfully!"            │
│    - Balance updated: $100,460                                  │
│    - Job card appears in "My Active Jobs"                      │
│                                                                 │
│ 8. Show in terminal:                                            │
│    [JOB-SERVICE] Job created: id=42, amount=0.487805 ETH       │
│    [PAYMENT-SERVICE] Funds locked: tx=0x1a2b3c...              │
│    [API-GATEWAY] Broadcast: job_created event                  │
│                                                                 │
│ 9. Show in Ganache UI:                                          │
│    - New transaction appears                                    │
│    - Employer balance decreased                                 │
│    - Contract balance increased                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACT 2: WORKER ACCEPTS JOB (2 minutes)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Press Ctrl+Shift+D → Click "AliceDev (Worker)"              │
│    - Screen transitions smoothly                                │
│    - No MetaMask popup needed (dev mode)                        │
│                                                                 │
│ 2. Worker Dashboard loads:                                      │
│    - Balance: $8,200 (2 ETH)                                   │
│    - "Browse Jobs" prominent                                    │
│    - Jobs Completed: 0                                          │
│                                                                 │
│ 3. Click "Browse Jobs":                                         │
│    - Job feed loads                                             │
│    - NEW job appears with 🔴 "NEW" badge                       │
│    - "Build React Dashboard - $2,000"                          │
│    - Pulsing animation on the card                             │
│                                                                 │
│ 4. Click job card → Details modal opens:                        │
│    - Full description                                           │
│    - Employer: TechStartupCo                                    │
│    - Payment: $2,000 (0.487805 ETH)                            │
│    - Time Limit: 48 hours                                       │
│    - 5 checklist items shown                                    │
│    - Big [ACCEPT JOB] button                                   │
│                                                                 │
│ 5. Click "Accept Job":                                          │
│    - Confirmation modal: "Accept this job?"                    │
│    - Details recap shown                                        │
│    - [YES, ACCEPT] [CANCEL]                                    │
│                                                                 │
│ 6. Click "Yes, Accept":                                         │
│    - Loading spinner                                            │
│    - Toast: "Job accepted! Start working."                     │
│    - Job moves to "My Active Jobs" section                     │
│    - Deadline countdown timer starts: "47h 59m remaining"      │
│                                                                 │
│ 7. Show in terminal:                                            │
│    [JOB-SERVICE] Job accepted: job_id=42, worker_id=3          │
│    [API-GATEWAY] Broadcast: job_accepted event                 │
│                                                                 │
│ 8. Switch back to employer (Ctrl+Shift+D):                     │
│    - Toast notification appears: "AliceDev accepted your job!" │
│    - Job status changed to "In Progress"                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACT 3: WORKER COMPLETES JOB (3 minutes)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Switch back to AliceDev (if not already)                    │
│                                                                 │
│ 2. Click on active job:                                         │
│    - Job details page opens                                     │
│    - Checklist visible with checkboxes                         │
│    - Progress bar: 0%                                           │
│                                                                 │
│ 3. Check off items one by one (with pause for effect):         │
│    ☑️ Setup project structure                                  │
│       → Progress bar: 20% (animated)                           │
│       → Toast: "1 of 5 tasks complete"                         │
│                                                                 │
│    ☑️ Build authentication                                     │
│       → Progress bar: 40%                                      │
│                                                                 │
│    ☑️ Create CRUD interfaces                                   │
│       → Progress bar: 60%                                      │
│                                                                 │
│    ☑️ Add analytics dashboard                                  │
│       → Progress bar: 80%                                      │
│       → Toast: "Almost done! 1 task remaining"                 │
│                                                                 │
│    ☑️ Deploy to production                                     │
│       → Progress bar: 100% (turns green)                       │
│       → Confetti animation 🎉                                  │
│       → [SUBMIT COMPLETION] button enables (was disabled)      │
│                                                                 │
│ 4. Click "Submit Completion":                                   │
│    - Confirmation modal:                                        │
│      "Submit job for payment release?"                         │
│      "Once submitted, you cannot undo this action."            │
│      [YES, SUBMIT] [REVIEW AGAIN]                              │
│                                                                 │
│ 5. Click "Yes, Submit":                                         │
│    - Loading modal appears:                                     │
│      "Releasing payment from escrow..."                        │
│      "Communicating with blockchain..."                        │
│      Progress indicator animates                               │
│                                                                 │
│ 6. Blockchain transaction modal:                                │
│    - "Transaction Sent!"                                        │
│    - TX Hash: 0xabc123... (copyable)                           │
│    - "Waiting for confirmation..."                             │
│    - Spinner animation (3-5 seconds)                           │
│                                                                 │
│ 7. Success! 🎊                                                  │
│    - Full-screen celebration animation                          │
│    - "Payment Received!"                                        │
│    - Amount: $2,000 (0.487805 ETH)                            │
│    - New Balance: $10,200 (2.487805 ETH)                      │
│    - [VIEW TRANSACTION] [CLOSE]                                │
│                                                                 │
│ 8. Balance counter animates up:                                 │
│    $8,200 → $8,500 → $9,000 → $9,500 → $10,200               │
│                                                                 │
│ 9. Job moves to "Completed Jobs" section                       │
│                                                                 │
│ 10. Show in terminal:                                           │
│     [JOB-SERVICE] Job completion submitted: job_id=42          │
│     [JOB-SERVICE] Calling Payment Service...                   │
│     [PAYMENT-SERVICE] Releasing escrow: 0.487805 ETH           │
│     [PAYMENT-SERVICE] Transaction sent: 0xabc123...            │
│     [PAYMENT-SERVICE] Transaction confirmed!                   │
│     [JOB-SERVICE] Job completed: job_id=42                     │
│     [API-GATEWAY] Broadcast: payment_received event            │
│                                                                 │
│ 11. Show in Ganache UI:                                         │
│     - New transaction appears                                   │
│     - Worker balance increased                                  │
│     - Contract balance decreased                                │
│     - Platform fee collected                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACT 4: EMPLOYER SEES COMPLETION (1 minute)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Switch back to TechStartupCo (Ctrl+Shift+D)                │
│                                                                 │
│ 2. Toast notification automatically appears:                    │
│    "🎉 Job completed by AliceDev!"                             │
│    "Payment of $2,000 was released"                            │
│    [VIEW JOB]                                                   │
│                                                                 │
│ 3. Dashboard updates:                                           │
│    - Active Jobs: 0                                             │
│    - Completed Jobs: 1                                          │
│    - Total Spent: $2,040                                        │
│                                                                 │
│ 4. Click on completed job:                                      │
│    - All details shown                                          │
│    - Checklist: All items ✅                                   │
│    - Worker: AliceDev                                           │
│    - Completion Time: 36 hours (calculated)                    │
│    - Transaction Hash: 0xabc123... (link to Ganache)          │
│    - [VIEW ON BLOCKCHAIN] button                               │
│                                                                 │
│ 5. Click "View on Blockchain":                                  │
│    - Opens Ganache UI in new tab                                │
│    - Highlights the specific transaction                        │
│    - Shows full blockchain details                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACT 5: TECHNICAL DEEP DIVE (2 minutes)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. REACT SKILLS (30 seconds)                                    │
│    - Open VS Code                                               │
│    - Show hooks/useJobs.js                                      │
│      → Custom hook with React Query                            │
│      → Optimistic updates implementation                       │
│      → Error handling                                           │
│    - Show contexts/AuthContext.jsx                              │
│      → JWT management                                           │
│      → User state management                                    │
│                                                                 │
│ 2. MICROSERVICES (60 seconds)                                   │
│    - Show terminal with service logs:                           │
│      [API-GATEWAY] Request routing                             │
│      [JOB-SERVICE] Business logic                              │
│      [PAYMENT-SERVICE] Blockchain interaction                  │
│    - Show docker-compose.yml:                                   │
│      → 3 separate services                                     │
│      → Network isolation                                        │
│      → Service-to-service communication                        │
│    - Run: docker ps                                             │
│      → Show all containers running                             │
│                                                                 │
│ 3. POSTGRESQL (60 seconds)                                      │
│    - Open DBeaver                                               │
│    - Show database schema:                                      │
│      → users table                                              │
│      → jobs table (with JSONB checklist)                       │
│      → transactions table                                       │
│    - Run complex query:                                         │
│      ```sql                                                     │
│      SELECT                                                     │
│        j.id, j.title, e.username as employer,                  │
│        w.username as worker, j.pay_amount_usd,                 │
│        t.tx_hash, t.confirmed_at                               │
│      FROM jobs j                                                │
│      JOIN users e ON j.employer_id = e.id                      │
│      JOIN users w ON j.worker_id = w.id                        │
│      JOIN transactions t ON j.id = t.job_id                    │
│      WHERE j.status = 'completed';                             │
│      ```                                                        │
│    - Show EXPLAIN ANALYZE:                                      │
│      → Index usage                                              │
│      → Query optimization                                       │
│                                                                 │
│ 4. BLOCKCHAIN (30 seconds)                                      │
│    - Show Ganache UI:                                           │
│      → All accounts and balances                               │
│      → Transaction history                                      │
│      → Smart contract address                                   │
│    - Show contract in VS Code:                                  │
│      → Solidity code                                            │
│      → Escrow logic                                             │
│      → Event emissions                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ACT 6: BONUS FEATURES (Optional - if time permits)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. TIME MANIPULATION DEMO:                                      │
│    - Open Dev Tools (Ctrl+Shift+D)                             │
│    - Create another job (quick)                                 │
│    - Click "+24h" button repeatedly                            │
│    - Show deadline approaching (timer turns red)               │
│    - Let job expire                                             │
│    - Show automatic refund triggered                           │
│    - Funds return to employer                                   │
│                                                                 │
│ 2. ERROR HANDLING DEMO:                                         │
│    - Try to accept an already-accepted job                     │
│      → Show 409 Conflict error with friendly message          │
│    - Try to complete job with incomplete checklist             │
│      → Show validation error                                    │
│    - Try to create job with insufficient balance               │
│      → Show 402 Payment Required error                         │
│                                                                 │
│ 3. ANALYTICS DASHBOARD:                                         │
│    - Click "Analytics" in navbar                                │
│    - Show charts:                                               │
│      → Jobs by category (pie chart)                            │
│      → Earnings over time (line chart)                         │
│      → Top workers leaderboard                                 │
│      → Platform fees collected                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`

---

## **12. SECURITY IMPLEMENTATION (Demo-Appropriate)**

### **Security Checklist**

yaml

`✅ IMPLEMENTED (Shows You Understand Security):

1. Environment Variables
   - .env file for secrets (not committed)
   - .env.example template (committed)
   - .gitignore includes .env

2. Authentication
   - MetaMask signature verification
   - JWT with 30-minute expiration
   - Refresh tokens (7-day expiration)
   - Session revocation capability

3. Input Validation
   - Pydantic models on all endpoints
   - SQL injection prevention (ORM only)
   - XSS prevention (input sanitization)
   - CSRF protection (token validation)

4. Database Security
   - Strong passwords (generated)
   - Connection pooling
   - Prepared statements only
   - Indexes for performance

5. API Security
   - CORS restricted to frontend origin
   - Service-to-service API keys
   - Rate limiting (simple implementation)
   - Request logging

6. Blockchain Security
   - Private keys in Docker secrets
   - MetaMask signs user transactions
   - Backend only reads blockchain
   - Transaction verification

7. Network Security
   - Docker network segmentation
   - Only API Gateway exposed
   - Services cannot access each other directly

8. Error Handling
   - No sensitive data in error messages
   - Proper HTTP status codes
   - Generic errors to clients
   - Detailed logs for debugging

⚠️ DOCUMENTED (Production Requirements):

- HTTPS with Let's Encrypt certificates
- Rate limiting at Nginx level (100 req/sec)
- DDoS protection
- AWS KMS for key management
- Database encryption at rest
- Audit logging
- Security headers (HSTS, CSP, etc.)
- Regular security scanning
- Penetration testing
- GDPR compliance
- SOC2 audit trail

📄 SECURITY_NOTES.md File (Create This):

*# Security Considerations for PayChain## Current Implementation (Demo)*

This demo implements **fundamental security practices** while remaining 
simple enough for a 10-minute presentation.

*### What We Have:*
✅ MetaMask signature authentication (no passwords to leak)
✅ JWT tokens with expiration
✅ Input validation on all endpoints
✅ SQL injection prevention (ORM usage)
✅ CORS restrictions
✅ Service-to-service authentication
✅ Docker network isolation
✅ Structured logging

*### What We Don't Have (By Design):*
❌ HTTPS/SSL (localhost demo, would add Let's Encrypt in production)
❌ Advanced rate limiting (Redis-based, would implement in production)
❌ Hardware security modules (would use AWS KMS in production)
❌ Full audit trail (would log all actions in production)
❌ Penetration testing (would conduct before production launch)

*## Production Hardening Checklist### Immediate (Before Public Launch):*
- [ ] Enable HTTPS with automatic certificate renewal
- [ ] Implement Redis-based rate limiting (per user, per IP)
- [ ] Move private keys to AWS KMS or HashiCorp Vault
- [ ] Add WAF (Web Application Firewall) like Cloudflare
- [ ] Enable database encryption at rest
- [ ] Implement comprehensive audit logging
- [ ] Add security headers (HSTS, CSP, X-Frame-Options)
- [ ] Set up intrusion detection (fail2ban)
- [ ] Implement CAPTCHA on registration

*### Within 30 Days:*
- [ ] Security audit by external firm
- [ ] Penetration testing
- [ ] Implement bug bounty program
- [ ] GDPR compliance review
- [ ] Add monitoring & alerting (PagerDuty)
- [ ] Implement automated backups with encryption
- [ ] Add multi-factor authentication option
- [ ] Code signing for smart contracts
- [ ] Insurance for smart contract vulnerabilities

*### Ongoing:*
- [ ] Regular dependency updates (Dependabot)
- [ ] Quarterly security audits
- [ ] Continuous monitoring
- [ ] Annual penetration testing
- [ ] Security training for team

*## Why These Trade-offs for Demo?*

**Goal**: Demonstrate technical skills in React, Python, PostgreSQL, and 
Microservices in a 10-minute demo.

**Decision**: Focus on clean architecture and proper patterns rather than 
enterprise security that:
1. Would take weeks to implement properly
2. Adds complexity that obscures the core skills being demonstrated
3. Requires infrastructure (WAF, KMS, etc.) not relevant to skill assessment

**Result**: A demo that shows:
- Deep understanding of security principles
- Awareness of production requirements
- Ability to make pragmatic engineering trade-offs
- Professional documentation of decisions

*## Security Questions - Prepared Answers*

**Q: "Why no HTTPS?"**
A: "For localhost demo, HTTPS adds certificate management complexity without 
demonstrating additional skills. In production, I'd use Let's Encrypt with 
automatic renewal via Certbot. The architecture supports HTTPS by simply 
updating the Nginx configuration."

**Q: "How would you handle a data breach?"**
A: "Immediate response plan: 1) Isolate affected systems, 2) Notify users 
within 72 hours (GDPR), 3) Conduct forensic analysis, 4) Patch vulnerability, 
5) Third-party security audit before returning to service. Prevention: 
Encryption at rest, audit logs, intrusion detection, regular security reviews."

**Q: "What about smart contract vulnerabilities?"**
A: "Current contract is demo-grade. Production would require: 1) Full unit test 
coverage, 2) Formal verification, 3) External audit by firms like Trail of Bits, 
4) Bug bounty program, 5) Upgradeable contract pattern, 6) Time-locked admin 
functions, 7) Insurance coverage (Nexus Mutual)."`

---

## **13. DOCKER & DEPLOYMENT**

### **Complete docker-compose.yml**

yaml

`version: '3.8'

services:
  *# ============================================# FRONTEND# ============================================*
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: paychain-frontend
    ports:`

Retry

Claude does not have the ability to run the code it generates yet.

D

Continue

yaml

      `- "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
      - VITE_WS_URL=ws://localhost:8080
      - VITE_ENVIRONMENT=development
    networks:
      - frontend-net
    depends_on:
      - api-gateway
    command: npm run dev -- --host

  *# ============================================# API GATEWAY# ============================================*
  api-gateway:
    build:
      context: ./backend/api_gateway
      dockerfile: Dockerfile
    container_name: paychain-api-gateway
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      - USER_SERVICE_URL=http://user-service:8001
      - JOB_SERVICE_URL=http://job-service:8002
      - PAYMENT_SERVICE_URL=http://payment-service:8003
      - WS_SERVICE_URL=http://websocket-server:8080
    networks:
      - frontend-net
      - backend-net
    depends_on:
      - user-service
      - job-service
      - payment-service
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  *# ============================================# USER SERVICE# ============================================*
  user-service:
    build:
      context: ./backend/user_service
      dockerfile: Dockerfile
    container_name: paychain-user-service
    ports:
      - "8001:8001"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql+asyncpg://paychain_user:${POSTGRES_PASSWORD}@postgres:5432/paychain_db
      - SERVICE_API_KEY=${USER_SERVICE_API_KEY}
    networks:
      - backend-net
      - database-net
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/user_service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8001 --reload

  *# ============================================# JOB SERVICE# ============================================*
  job-service:
    build:
      context: ./backend/job_service
      dockerfile: Dockerfile
    container_name: paychain-job-service
    ports:
      - "8002:8002"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql+asyncpg://paychain_user:${POSTGRES_PASSWORD}@postgres:5432/paychain_db
      - USER_SERVICE_URL=http://user-service:8001
      - PAYMENT_SERVICE_URL=http://payment-service:8003
      - WS_SERVICE_URL=http://websocket-server:8080
      - SERVICE_API_KEY=${JOB_SERVICE_API_KEY}
    networks:
      - backend-net
      - database-net
    depends_on:
      postgres:
        condition: service_healthy
      user-service:
        condition: service_started
      payment-service:
        condition: service_started
    volumes:
      - ./backend/job_service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8002 --reload

  *# ============================================# PAYMENT SERVICE# ============================================*
  payment-service:
    build:
      context: ./backend/payment_service
      dockerfile: Dockerfile
    container_name: paychain-payment-service
    ports:
      - "8003:8003"
    env_file:
      - .env
    environment:
      - DATABASE_URL=postgresql+asyncpg://paychain_user:${POSTGRES_PASSWORD}@postgres:5432/paychain_db
      - GANACHE_URL=http://ganache:8545
      - CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
      - PLATFORM_PRIVATE_KEY=${PLATFORM_PRIVATE_KEY}
      - JOB_SERVICE_URL=http://job-service:8002
      - WS_SERVICE_URL=http://websocket-server:8080
      - SERVICE_API_KEY=${PAYMENT_SERVICE_API_KEY}
    networks:
      - backend-net
      - database-net
      - blockchain-net
    depends_on:
      postgres:
        condition: service_healthy
      ganache:
        condition: service_started
    volumes:
      - ./backend/payment_service:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8003 --reload

  *# ============================================# WEBSOCKET SERVER# ============================================*
  websocket-server:
    build:
      context: ./backend/websocket_server
      dockerfile: Dockerfile
    container_name: paychain-websocket
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    networks:
      - backend-net
      - frontend-net
    volumes:
      - ./backend/websocket_server:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8080 --reload

  *# ============================================# POSTGRESQL DATABASE# ============================================*
  postgres:
    image: postgres:16-alpine
    container_name: paychain-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=paychain_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=paychain_db
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    networks:
      - database-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U paychain_user -d paychain_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  *# ============================================# GANACHE (LOCAL BLOCKCHAIN)# ============================================*
  ganache:
    image: trufflesuite/ganache:latest
    container_name: paychain-ganache
    ports:
      - "8545:8545"
    volumes:
      - ganache-data:/ganache_data
    networks:
      - blockchain-net
    command: >
      --database.dbPath /ganache_data
      --wallet.deterministic
      --wallet.mnemonic "test test test test test test test test test test test junk"
      --wallet.totalAccounts 10
      --wallet.defaultBalance 1000
      --chain.networkId 1337
      --chain.chainId 1337
      --miner.blockTime 2
      --server.host 0.0.0.0
      --server.port 8545
      --logging.verbose

  *# ============================================# REDIS (For Rate Limiting & Caching)# ============================================*
  redis:
    image: redis:7-alpine
    container_name: paychain-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - backend-net
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  *# ============================================# NGINX REVERSE PROXY (Production-Like)# ============================================*
  nginx:
    image: nginx:alpine
    container_name: paychain-nginx
    ports:
      - "80:80"
      *# - "443:443"  # Uncomment for HTTPS*
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro  *# SSL certificates (if using HTTPS)*
    networks:
      - frontend-net
    depends_on:
      - frontend
      - api-gateway
    restart: unless-stopped

*# ============================================# NETWORKS# ============================================*
networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
  database-net:
    driver: bridge
    internal: true  *# No external access*
  blockchain-net:
    driver: bridge
    internal: true  *# No external access# ============================================# VOLUMES# ============================================*
volumes:
  postgres-data:
    driver: local
  ganache-data:
    driver: local
  redis-data:
    driver: local`

### **Dockerfile Templates**

**Frontend Dockerfile:**

dockerfile

`*# frontend/Dockerfile*
FROM node:20-alpine

WORKDIR /app

*# Copy package files*
COPY package*.json ./

*# Install dependencies*
RUN npm ci

*# Copy application code*
COPY . .

*# Expose port*
EXPOSE 5173

*# Start development server*
CMD ["npm", "run", "dev", "--", "--host"]`

**Backend Service Dockerfile (Template for all services):**

dockerfile

`*# backend/*/Dockerfile*
FROM python:3.11-slim

WORKDIR /app

*# Install system dependencies*
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

*# Copy requirements*
COPY requirements.txt .

*# Install Python dependencies*
RUN pip install --no-cache-dir -r requirements.txt

*# Copy application code*
COPY . .

*# Expose port (change per service)*
EXPOSE 8001

*# Run application*
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]`

### **Nginx Configuration**

nginx

`*# nginx/nginx.conf*
events {
    worker_connections 1024;
}

http {
    *# Rate limiting zones*
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

    *# Upstream backends*
    upstream api_gateway {
        server api-gateway:8000;
    }

    upstream frontend {
        server frontend:5173;
    }

    upstream websocket {
        server websocket-server:8080;
    }

    *# Main server block*
    server {
        listen 80;
        server_name localhost;

        *# Security headers*
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        *# Frontend*
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        *# API Gateway*
        location /api/ {
            limit_req zone=api_limit burst=10 nodelay;
            
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            *# CORS headers*
            add_header 'Access-Control-Allow-Origin' 'http://localhost:5173' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        *# Auth endpoints (stricter rate limiting)*
        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        *# WebSocket*
        location /ws {
            proxy_pass http://websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400;
        }

        *# Health check endpoint (no rate limiting)*
        location /health {
            proxy_pass http://api_gateway/health;
        }
    }

    *# HTTPS server block (for production)# server {#     listen 443 ssl http2;#     server_name yourdomain.com;##     ssl_certificate /etc/nginx/ssl/fullchain.pem;#     ssl_certificate_key /etc/nginx/ssl/privkey.pem;#     ssl_protocols TLSv1.2 TLSv1.3;#     ssl_ciphers HIGH:!aNULL:!MD5;##     # ... same location blocks as above# }*
}`

### **Setup Scripts**

**setup-dev.sh (Initial Setup):**

bash

`#!/bin/bash

echo "🚀 PayChain Development Setup"
echo "=============================="

*# Check if .env exists*
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

*# Generate secrets*
echo "🔐 Generating secure secrets..."

JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
USER_SERVICE_KEY=$(openssl rand -hex 16)
JOB_SERVICE_KEY=$(openssl rand -hex 16)
PAYMENT_SERVICE_KEY=$(openssl rand -hex 16)

*# Create .env from template*
cp .env.example .env

*# Replace placeholders*
sed -i "s/CHANGE_ME_POSTGRES_PASSWORD/$POSTGRES_PASSWORD/" .env
sed -i "s/CHANGE_ME_JWT_SECRET/$JWT_SECRET/" .env
sed -i "s/CHANGE_ME_USER_SERVICE_KEY/$USER_SERVICE_KEY/" .env
sed -i "s/CHANGE_ME_JOB_SERVICE_KEY/$JOB_SERVICE_KEY/" .env
sed -i "s/CHANGE_ME_PAYMENT_SERVICE_KEY/$PAYMENT_SERVICE_KEY/" .env

echo "✅ Secrets generated and saved to .env"

*# Build Docker images*
echo ""
echo "🐳 Building Docker images..."
docker-compose build

echo ""
echo "📦 Starting services..."
docker-compose up -d postgres redis ganache

*# Wait for PostgreSQL to be ready*
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

*# Run database migrations*
echo ""
echo "📊 Running database migrations..."
docker-compose exec postgres psql -U paychain_user -d paychain_db -f /docker-entrypoint-initdb.d/01-init.sql

*# Deploy smart contract*
echo ""
echo "⛓️  Deploying smart contract to Ganache..."
cd blockchain
npm install
npx hardhat run scripts/deploy.js --network ganache
cd ..

*# Save contract address to .env*
echo ""
echo "💾 Saving contract address..."
*# (Contract address will be saved by deploy script)# Start all services*
echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔌 API Gateway: http://localhost:8000"
echo "🔗 Ganache: http://localhost:8545"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "⚠️  IMPORTANT: Never commit .env to Git!"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""`

**start-demo.sh (Quick Start for Demo):**

bash

`#!/bin/bash

echo "🎬 Starting PayChain Demo..."

*# Check if already running*
if docker-compose ps | grep -q "Up"; then
    echo "⚠️  Services already running!"
    echo "Restarting..."
    docker-compose restart
else
    echo "🚀 Starting services..."
    docker-compose up -d
fi

*# Wait for services to be healthy*
echo "⏳ Waiting for services to be ready..."
sleep 15

*# Check health*
echo ""
echo "🏥 Health Check:"
echo "==============="

*# API Gateway*
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ API Gateway: Online"
else
    echo "❌ API Gateway: Offline"
fi

*# PostgreSQL*
if docker-compose exec -T postgres pg_isready -U paychain_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Connected"
else
    echo "❌ PostgreSQL: Disconnected"
fi

*# Ganache*
if curl -sf http://localhost:8545 > /dev/null; then
    echo "✅ Ganache: Online"
else
    echo "❌ Ganache: Offline"
fi

*# Redis*
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Online"
else
    echo "❌ Redis: Offline"
fi

echo ""
echo "🎉 PayChain is ready for demo!"
echo ""
echo "🌐 Open: http://localhost:5173"
echo "🛠️  Dev Tools: Press Ctrl+Shift+D"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo ""`

**reset-demo.sh (Reset Everything):**

bash

`#!/bin/bash

echo "⚠️  RESET DEMO DATA"
echo "==================="
echo ""
echo "This will:"
echo "  - Reset database to initial state"
echo "  - Reset Ganache blockchain"
echo "  - Clear Redis cache"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🔄 Resetting demo data..."

*# Stop services*
docker-compose stop

*# Remove volumes*
docker volume rm paychain_postgres-data paychain_ganache-data paychain_redis-data 2>/dev/null || true

*# Restart services*
docker-compose up -d

*# Wait for PostgreSQL*
sleep 10

*# Run seed script*
echo "📊 Seeding database..."
docker-compose exec -T postgres psql -U paychain_user -d paychain_db -f /docker-entrypoint-initdb.d/02-seed.sql

*# Redeploy contract*
echo "⛓️  Redeploying smart contract..."
cd blockchain
npx hardhat run scripts/deploy.js --network ganache
cd ..

echo ""
echo "✅ Demo reset complete!"
echo "🌐 Ready at: http://localhost:5173"
echo ""`

---

## **14. DEMO PREPARATION**

### **Pre-Demo Checklist (1 Day Before)**

markdown

`# PayChain Demo Checklist

## Code Preparation
- [ ] Remove all console.log() statements
- [ ] Remove all TODO/FIXME comments
- [ ] Add docstrings to all functions
- [ ] Run code formatter (Black for Python, Prettier for JS)
- [ ] Check for any hardcoded values
- [ ] Ensure all imports are used
- [ ] Remove dead code

## Documentation
- [ ] README.md is complete and accurate
- [ ] ARCHITECTURE.md created with diagrams
- [ ] SECURITY_NOTES.md created
- [ ] API.md created with all endpoints
- [ ] Comments in complex code sections
- [ ] .env.example is up to date

## Data & Setup
- [ ] Database seed script works correctly
- [ ] All 5 demo accounts exist with correct balances
- [ ] 5-8 sample jobs created
- [ ] Jobs in different states (open, in progress, completed)
- [ ] Smart contract deployed successfully
- [ ] Contract address saved in .env

## Testing
- [ ] All services start with `docker-compose up`
- [ ] Health check endpoints return 200
- [ ] Can create job as employer
- [ ] Can accept job as worker
- [ ] Can complete job and receive payment
- [ ] WebSocket events trigger correctly
- [ ] Dev tools panel works (Ctrl+Shift+D)
- [ ] User switching works seamlessly
- [ ] Time manipulation works
- [ ] Reset demo works

## Demo Environment
- [ ] Clean browser (no extensions running)
- [ ] MetaMask installed and configured
- [ ] Ganache network added to MetaMask
- [ ] All demo accounts imported to MetaMask
- [ ] Terminal window prepared with docker-compose logs
- [ ] Ganache UI open in separate tab
- [ ] DBeaver connected to PostgreSQL
- [ ] VS Code open with clean workspace
- [ ] Bookmark important code files

## Presentation Materials
- [ ] Architecture diagram ready to show
- [ ] Backup slides prepared (if demo fails)
- [ ] List of questions prepared
- [ ] Answers to common questions ready
- [ ] Laptop fully charged
- [ ] Backup laptop available
- [ ] HDMI/USB-C adapter tested

## Practice
- [ ] Run complete demo 5 times
- [ ] Time yourself (stay under 10 minutes)
- [ ] Practice answers to technical questions
- [ ] Practice recovering from errors
- [ ] Test on different browser (backup)
- [ ] Test with network issues simulated

## Backup Plan
- [ ] Screenshots of working demo
- [ ] Video recording of demo
- [ ] Backup data exported
- [ ] GitHub repo up to date
- [ ] Demo can run locally without Docker (fallback)`

### **Demo Day Checklist (Morning Of)**

markdown

`# Day-of Demo Checklist

## 2 Hours Before
- [ ] Start all services: `./start-demo.sh`
- [ ] Verify health checks pass
- [ ] Reset demo data: `./reset-demo.sh`
- [ ] Test complete user flow once
- [ ] Check internet connection
- [ ] Charge laptop
- [ ] Prepare backup laptop

## 30 Minutes Before
- [ ] Close unnecessary applications
- [ ] Clear browser history/cache
- [ ] Restart browser
- [ ] Open all necessary tabs
- [ ] Test presentation screen/projector
- [ ] Test audio (if demoing)
- [ ] Silence phone notifications
- [ ] Close email/Slack

## 5 Minutes Before
- [ ] Navigate to landing page
- [ ] Open dev tools panel (verify it works)
- [ ] Close dev tools panel
- [ ] Open terminal with logs
- [ ] Open Ganache UI
- [ ] Breathe deeply
- [ ] You got this! 💪`

### **Emergency Recovery Procedures**

markdown

`# If Something Goes Wrong

## Service Won't Start
1. Check logs: `docker-compose logs <service-name>`
2. Restart service: `docker-compose restart <service-name>`
3. Rebuild if needed: `docker-compose up -d --build <service-name>`
4. Fallback: Show code instead, explain what would happen

## Database Connection Fails
1. Check PostgreSQL: `docker-compose exec postgres pg_isready`
2. Restart database: `docker-compose restart postgres`
3. Wait 10 seconds, retry
4. Fallback: Show pre-recorded screenshots

## Ganache Not Responding
1. Check container: `docker ps | grep ganache`
2. Restart: `docker-compose restart ganache`
3. Redeploy contract if needed
4. Fallback: Explain blockchain integration with diagrams

## MetaMask Issues
1. Switch networks manually
2. Re-import account if needed
3. Use different demo account
4. Fallback: Show transaction in Ganache UI directly

## Frontend Not Loading
1. Check if Vite is running: `docker-compose logs frontend`
2. Restart: `docker-compose restart frontend`
3. Clear browser cache
4. Fallback: Switch to backup browser/laptop

## Complete System Failure
1. Stay calm
2. Switch to presentation slides with screenshots
3. Walk through code in VS Code instead
4. Show pre-recorded video demo
5. Explain architecture with whiteboard/diagrams
6. CEO cares more about your understanding than perfect demo`

---

## **15. FUTURE ENHANCEMENTS (Mention These)**

markdown

`# PayChain: Roadmap & Future Features

## Phase 1: MVP+ (2-4 Weeks)
- [ ] Rating system (5-star reviews)
- [ ] In-app messaging (employer ↔ worker)
- [ ] Email notifications
- [ ] Job templates (recurring jobs)
- [ ] Worker portfolios
- [ ] Dispute resolution system

## Phase 2: Platform Growth (2-3 Months)
- [ ] Advanced search with AI matching
- [ ] Multi-currency support
- [ ] Milestone-based payments (not just completion)
- [ ] Team collaboration (multiple workers per job)
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations

## Phase 3: Enterprise Features (3-6 Months)
- [ ] White-label solution for companies
- [ ] Bulk job posting
- [ ] Advanced analytics dashboard
- [ ] Machine learning for fraud detection
- [ ] Automated KYC/AML compliance
- [ ] Multi-signature escrow for large contracts

## Phase 4: Web3 Evolution (6-12 Months)
- [ ] Deploy to Ethereum mainnet
- [ ] Support multiple blockchains (Polygon, Arbitrum)
- [ ] NFT-based credentials
- [ ] DAO governance token
- [ ] Decentralized reputation system
- [ ] Integration with DeFi protocols

## Technical Debt to Address
- [ ] Migrate from Ganache to Ethereum testnet
- [ ] Implement proper message queue (RabbitMQ/Kafka)
- [ ] Add comprehensive test coverage (80%+)
- [ ] Implement CDC (Change Data Capture) for data sync
- [ ] Add GraphQL API layer
- [ ] Implement service mesh (Istio)
- [ ] Add APM (Application Performance Monitoring)
- [ ] Implement blue-green deployments

## Scaling Strategy
- [ ] Horizontal scaling with Kubernetes
- [ ] Database sharding (partition by user_id)
- [ ] CDN for frontend assets (Cloudflare)
- [ ] Read replicas for analytics queries
- [ ] Caching layer (Redis Cluster)
- [ ] Elasticsearch for advanced search
- [ ] Event sourcing architecture`

---

## **16. FINAL ARCHITECTURE SUMMARY (At a Glance)**

`┌─────────────────────────────────────────────────────────────────┐
│                    PAYCHAIN ARCHITECTURE                        │
│                  (Full-Stack Microservices Demo)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND                                                       │
│  ├─ React 18 + Vite                                            │
│  ├─ TanStack Query (caching & optimistic updates)              │
│  ├─ Context API (auth, wallet)                                 │
│  ├─ Custom hooks (useJobs, useMetaMask, useWebSocket)          │
│  ├─ Tailwind CSS                                                │
│  └─ ethers.js (blockchain interaction)                         │
│                                                                 │
│  BACKEND (TRUE MICROSERVICES)                                  │
│  ├─ API Gateway (8000) - Routing, auth, rate limiting          │
│  ├─ User Service (8001) - Auth, profiles, JWT                  │
│  ├─ Job Service (8002) - CRUD, checklist, completion           │
│  ├─ Payment Service (8003) - Escrow, blockchain               │
│  └─ WebSocket Server (8080) - Real-time events                 │
│                                                                 │
│  TECHNOLOGY STACK                                               │
│  ├─ Language: Python 3.11 (FastAPI)                            │
│  ├─ Database: PostgreSQL 16                                     │
│  ├─ Blockchain: Ganache + Solidity 0.8.20                      │
│  ├─ Cache: Redis 7                                              │
│  ├─ Container: Docker + Docker Compose                          │
│  └─ Reverse Proxy: Nginx                                        │
│                                                                 │
│  DATABASE SCHEMA                                                │
│  ├─ users (5 tables total)                                     │
│  ├─ jobs (with JSONB checklist)                                │
│  ├─ transactions                                                │
│  ├─ sessions (JWT revocation)                                  │
│  └─ notifications                                               │
│                                                                 │
│  SMART CONTRACT                                                 │
│  ├─ PayChainEscrow.sol                                          │
│  ├─ Functions: createJob, releasePayment, refundExpiredJob     │
│  ├─ Events: JobCreated, PaymentReleased, JobRefunded           │
│  └─ Platform Fee: 2%                                            │
│                                                                 │
│  AUTHENTICATION                                                 │
│  ├─ MetaMask signature-based (no passwords)                    │
│  ├─ JWT access tokens (30 min)                                 │
│  ├─ Refresh tokens (7 days)                                    │
│  └─ Service-to-service API keys                                │
│                                                                 │
│  SECURITY                                                       │
│  ├─ .env for secrets                                            │
│  ├─ Pydantic input validation                                  │
│  ├─ SQL injection prevention (ORM)                             │
│  ├─ CORS restrictions                                           │
│  ├─ Docker network isolation                                   │
│  ├─ Rate limiting                                               │
│  └─ Production hardening documented in SECURITY_NOTES.md       │
│                                                                 │
│  DEMO FEATURES                                                  │
│  ├─ Quick user switching (Ctrl+Shift+D)                        │
│  ├─ Time manipulation (fast-forward)                           │
│  ├─ Scenario triggers (instant job completion)                 │
│  ├─ System health monitor                                      │
│  ├─ Demo reset button                                           │
│  └─ Real-time WebSocket updates                                │
│                                                                 │
│  KEY METRICS                                                    │
│  ├─ Services: 5 microservices                                  │
│  ├─ Endpoints: 30+ REST APIs                                   │
│  ├─ Database: 5 tables, 15+ indexes                            │
│  ├─ Demo Accounts: 2 employers, 3 workers                      │
│  ├─ Setup Time: < 5 minutes                                    │
│  └─ Demo Duration: 10 minutes                                  │
│                                                                 │
│  DEMONSTRATES                                                   │
│  ✅ React: Hooks, Context, React Query, Performance Opts       │
│  ✅ Python: FastAPI, Async/Await, Type Hints, Pydantic        │
│  ✅ PostgreSQL: Complex Queries, J`

Retry

Claude does not have the ability to run the code it generates yet.

D

Continue

OINs, Window Functions, Indexes │
│  ✅ Microservices: True isolation, Service communication      │
│  ✅ Blockchain: Smart contracts, MetaMask, Escrow pattern     │
│  ✅ Docker: Multi-container orchestration                     │
│  ✅ Architecture: Clean code, Separation of concerns          │
│  ✅ Security: Auth, Validation, Best practices                │
│  ✅ Problem-Solving: Real-world gig economy solution          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

`---

## **17. QUICK REFERENCE COMMANDS**
````bash
# ============================================
# SETUP & DEPLOYMENT
# ============================================

# Initial setup (run once)
./setup-dev.sh

# Start demo
./start-demo.sh

# Reset demo to initial state
./reset-demo.sh

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f job-service

# ============================================
# DOCKER COMMANDS
# ============================================

# Build all images
docker-compose build

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart payment-service

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec postgres psql -U paychain_user

# ============================================
# DATABASE COMMANDS
# ============================================

# Connect to PostgreSQL
docker-compose exec postgres psql -U paychain_user -d paychain_db

# Run migrations
docker-compose exec postgres psql -U paychain_user -d paychain_db -f /path/to/migration.sql

# Backup database
docker-compose exec postgres pg_dump -U paychain_user paychain_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U paychain_user -d paychain_db < backup.sql

# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds
docker-compose exec postgres psql -U paychain_user -d paychain_db -f /docker-entrypoint-initdb.d/01-init.sql
docker-compose exec postgres psql -U paychain_user -d paychain_db -f /docker-entrypoint-initdb.d/02-seed.sql

# ============================================
# BLOCKCHAIN COMMANDS
# ============================================

# Deploy smart contract
cd blockchain
npx hardhat run scripts/deploy.js --network ganache

# Interact with contract
npx hardhat console --network ganache

# Get contract info
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x70997970C51812dc3A010C7d01b50e0d17dc79C8","latest"],"id":1}'

# ============================================
# DEVELOPMENT
# ============================================

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd backend/user_service && pip install -r requirements.txt

# Run linting (Python)
cd backend && black . && flake8 .

# Run linting (JavaScript)
cd frontend && npm run lint

# Run tests
docker-compose exec user-service pytest
docker-compose exec job-service pytest

# ============================================
# DEBUGGING
# ============================================

# Check API Gateway health
curl http://localhost:8000/health

# Check service connectivity
docker-compose exec api-gateway curl http://user-service:8001/health

# Check PostgreSQL connection
docker-compose exec postgres pg_isready -U paychain_user

# Check Ganache
curl http://localhost:8545

# Check Redis
docker-compose exec redis redis-cli ping

# View environment variables
docker-compose exec user-service env | grep DATABASE_URL

# ============================================
# CLEANUP
# ============================================

# Stop and remove all containers
docker-compose down

# Remove volumes (delete all data)
docker-compose down -v

# Remove all PayChain images
docker images | grep paychain | awk '{print $3}' | xargs docker rmi

# Prune unused Docker resources
docker system prune -a --volumes
````

---

## **18. TROUBLESHOOTING GUIDE**
````markdown
# Common Issues & Solutions

## Issue: Services won't start
**Symptoms:** `docker-compose up` fails or services crash immediately

**Solutions:**
1. Check logs: `docker-compose logs <service-name>`
2. Verify .env file exists and has all required variables
3. Check if ports are already in use: `lsof -i :8000` (on Mac/Linux)
4. Rebuild images: `docker-compose build --no-cache`
5. Remove volumes and restart: `docker-compose down -v && docker-compose up -d`

## Issue: Database connection refused
**Symptoms:** Services can't connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running: `docker-compose ps postgres`
2. Wait for health check: `docker-compose exec postgres pg_isready`
3. Verify DATABASE_URL in .env is correct
4. Check network connectivity: `docker-compose exec user-service ping postgres`
5. Restart database: `docker-compose restart postgres`

## Issue: Ganache not responding
**Symptoms:** Payment service can't connect to blockchain

**Solutions:**
1. Check Ganache logs: `docker-compose logs ganache`
2. Verify Ganache is on correct network: `docker network ls`
3. Test connection: `curl http://localhost:8545`
4. Restart Ganache: `docker-compose restart ganache`
5. Redeploy contract: `cd blockchain && npx hardhat run scripts/deploy.js --network ganache`

## Issue: MetaMask not connecting
**Symptoms:** Frontend can't detect MetaMask or transactions fail

**Solutions:**
1. Verify MetaMask is installed and unlocked
2. Check correct network is selected (Ganache - Chain ID 1337)
3. Add network manually:
   - Network Name: Ganache Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency: ETH
4. Import demo account using private key
5. Reset MetaMask account (Settings → Advanced → Reset Account)

## Issue: JWT token expired
**Symptoms:** "Token has expired" error

**Solutions:**
1. This is expected after 30 minutes
2. Use dev tools to switch users (auto-generates new token)
3. Clear localStorage and re-login
4. Check system clock is correct

## Issue: CORS errors in browser
**Symptoms:** "Access-Control-Allow-Origin" errors

**Solutions:**
1. Verify CORS_ALLOWED_ORIGINS in .env includes http://localhost:5173
2. Check API Gateway CORS middleware is configured
3. Restart API Gateway: `docker-compose restart api-gateway`
4. Clear browser cache
5. Try different browser

## Issue: Dev tools panel not appearing
**Symptoms:** Ctrl+Shift+D doesn't open dev panel

**Solutions:**
1. Verify ENVIRONMENT=development in .env
2. Check browser console for JavaScript errors
3. Try Ctrl+Shift+D again (case-sensitive)
4. Refresh page (Ctrl+F5)
5. Check if browser extension is blocking it

## Issue: WebSocket not connecting
**Symptoms:** No real-time updates

**Solutions:**
1. Check WebSocket server: `docker-compose logs websocket-server`
2. Verify WS_URL in frontend .env: ws://localhost:8080
3. Check browser console for WebSocket errors
4. Restart WebSocket server: `docker-compose restart websocket-server`
5. Check firewall isn't blocking port 8080

## Issue: Smart contract deployment fails
**Symptoms:** Error during contract deployment

**Solutions:**
1. Check Ganache is running: `curl http://localhost:8545`
2. Verify blockchain directory has node_modules: `cd blockchain && npm install`
3. Check hardhat.config.js has correct Ganache URL
4. Ensure accounts have sufficient balance
5. Redeploy: `npx hardhat run scripts/deploy.js --network ganache --reset`

## Issue: Slow query performance
**Symptoms:** API responses taking > 1 second

**Solutions:**
1. Check if indexes exist: 
```sql
   SELECT * FROM pg_indexes WHERE tablename = 'jobs';
```
2. Run EXPLAIN ANALYZE on slow queries
3. Add missing indexes
4. Refresh materialized views: `REFRESH MATERIALIZED VIEW job_analytics;`
5. Check PostgreSQL logs: `docker-compose logs postgres`

## Issue: Out of memory errors
**Symptoms:** Services crash with OOM errors

**Solutions:**
1. Increase Docker memory limit (Docker Desktop → Settings → Resources)
2. Check for memory leaks in logs
3. Restart Docker daemon
4. Close unnecessary applications
5. Reduce number of running services temporarily
````

---

## **19. CEO PRESENTATION TALKING POINTS**
````markdown
# Key Messages for CEO Presentation

## Opening (30 seconds)
"I built PayChain, a blockchain-based escrow platform for gig workers. 
It solves the trust problem in freelance work - workers don't get 
stiffed, employers don't get ghosted. Funds lock in a smart contract 
at job creation and auto-release on completion."

## Technical Highlights (As You Demo)

### React Skills
"I'm using modern React patterns here - custom hooks for state 
management, React Query for server state caching with optimistic 
updates, and Context API for global state. When a worker accepts 
this job, the UI updates immediately before the server responds, 
then rolls back if there's an error."

### Microservices Architecture
"This runs on four separate Python microservices - User, Job, 
Payment, and a WebSocket server. Each has a single responsibility 
and communicates via REST APIs with service-to-service authentication. 
They're completely isolated with separate Docker networks. Watch the 
logs - you can see them communicating in real-time."

### PostgreSQL
"The database uses advanced PostgreSQL features. Let me show you 
this analytics query - it uses window functions to rank workers by 
earnings, JOINs three tables, and completes in under 3 milliseconds 
thanks to composite indexes. I'm also using JSONB columns for the 
flexible checklist structure."

### Blockchain Integration
"Every payment creates a real Ethereum transaction. This isn't 
simulated - these are actual blockchain transactions you can verify. 
The smart contract holds funds in escrow and releases them atomically 
on job completion. Here's the Ganache blockchain explorer showing 
all the transactions."

## Handling Questions

### "Why blockchain?"
"Blockchain provides immutable audit trails and removes the need for 
a trusted middleman. The escrow logic is in code, not a black box. 
Anyone can verify transactions. It's especially valuable for 
international work where trust is harder to establish."

### "How does this scale?"
"The microservices architecture allows independent horizontal scaling. 
I can add more Job Service instances behind a load balancer. The 
database has proper indexes - this query handles 10,000 jobs in 2ms. 
For true scale, I'd add Redis caching, database read replicas, and 
potentially migrate to a Layer 2 blockchain like Polygon for lower 
gas fees."

### "What about security?"
"For this demo, I focused on fundamentals - JWT authentication, 
input validation with Pydantic, SQL injection prevention through 
ORM usage, CORS restrictions, and Docker network isolation. I've 
documented production requirements in SECURITY_NOTES.md - things 
like HTTPS, advanced rate limiting, AWS KMS for key management. 
Happy to discuss any specific concerns."

### "How long did this take?"
"About 4-5 days of focused work. I prioritized demonstrating the 
breadth of skills - React, Python, PostgreSQL, Docker, blockchain - 
while maintaining clean architecture and proper patterns throughout."

### "What would you improve?"
"Several things: First, add comprehensive test coverage - I'd aim 
for 80%+ with unit and integration tests. Second, implement proper 
message queuing with RabbitMQ for event-driven architecture. Third, 
add monitoring with Prometheus and Grafana. Fourth, implement a 
dispute resolution system for edge cases. I've documented these in 
the project roadmap."

### "Can you walk through the code?"
"Absolutely. Let me show you [PICK ONE]:
- The custom useJobs hook showing React Query with optimistic updates
- The Job Service showing FastAPI async patterns and dependency injection
- The smart contract showing the escrow lock/release logic
- The database schema showing the JSONB checklist structure"

## Closing (30 seconds)
"In summary, PayChain demonstrates full-stack capabilities - modern 
React on the frontend, well-architected Python microservices, 
advanced PostgreSQL queries, and real blockchain integration. More 
importantly, it shows I can identify a problem, architect a solution, 
and execute across the entire stack while maintaining clean, 
professional code."

## If Demo Fails
"While I troubleshoot this, let me show you the architecture and walk 
through the code. The key thing isn't that demos work perfectly - it's 
that I understand the principles deeply. Let me explain how this system 
is designed..." [Show architecture diagram and code]
````

---

## **20. SUCCESS METRICS & VALIDATION**
````markdown
# How to Know Your Demo is Ready

## Technical Validation ✅
- [ ] All services start with single command
- [ ] Health checks pass for all services
- [ ] Complete user flow works (create → accept → complete → paid)
- [ ] No console errors in browser
- [ ] No exceptions in backend logs
- [ ] Database queries execute < 100ms
- [ ] Blockchain transactions confirm < 5s
- [ ] WebSocket events trigger correctly
- [ ] Dev tools work perfectly
- [ ] Can reset demo and repeat

## Code Quality ✅
- [ ] README.md is comprehensive
- [ ] All functions have docstrings
- [ ] No commented-out code
- [ ] Consistent formatting throughout
- [ ] No magic numbers (use constants)
- [ ] Error messages are user-friendly
- [ ] API responses are consistent
- [ ] Database schema is normalized
- [ ] Smart contract follows best practices
- [ ] Security notes document exists

## Presentation Readiness ✅
- [ ] Can complete demo in < 10 minutes
- [ ] Can explain every technical decision
- [ ] Can answer "why" questions confidently
- [ ] Can recover from errors gracefully
- [ ] Have practiced 5+ times
- [ ] Backup plan prepared
- [ ] Screenshots saved
- [ ] Video recording available
- [ ] Confident in your abilities
- [ ] Excited to show your work

## CEO Impression Checklist ✅
Does the demo show:
- [ ] Deep technical understanding (not just tutorials)
- [ ] Clean, professional code
- [ ] Real problem-solving
- [ ] Full-stack capabilities
- [ ] Modern best practices
- [ ] Ability to explain clearly
- [ ] Passion for technology
- [ ] Production mindset
- [ ] Security awareness
- [ ] Scalability thinking

## Red Flags to Avoid ❌
- [ ] Demo takes > 15 minutes
- [ ] Too much time in setup
- [ ] Apologizing for code quality
- [ ] Making excuses
- [ ] Can't explain why you made decisions
- [ ] Code is messy/uncommented
- [ ] Services fail to start
- [ ] No backup plan
- [ ] Speaking too quietly
- [ ] Not showing enthusiasm
````

---

## **21. FINAL NOTES**
````markdown
# Remember These Key Points

## What Makes This Demo Strong

1. **Solves Real Problem**: Gig economy trust issue
2. **Full Stack**: React, Python, PostgreSQL, Blockchain
3. **True Microservices**: Not just split routes, actual isolated services
4. **Modern Patterns**: Hooks, async/await, dependency injection
5. **Production Thinking**: Security notes, scalability considerations
6. **Clean Architecture**: Separation of concerns, SOLID principles
7. **Demo Polish**: Dev tools, quick user switch, time manipulation
8. **Comprehensive**: 5 services, 30+ APIs, 5 tables, smart contract

## What Makes You Hireable

- **Technical Depth**: Understanding the "why" behind every decision
- **Communication**: Explaining complex topics clearly
- **Problem Solving**: Creative solutions to challenges
- **Code Quality**: Clean, readable, maintainable
- **Professionalism**: Documentation, structure, best practices
- **Learning Ability**: Built complex system in short time
- **Passion**: Genuine excitement about technology
- **Pragmatism**: Right trade-offs for context (demo vs production)

## The Secret Weapon

Your **understanding** matters more than perfect execution.

CEOs hiring senior developers want people who:
- Understand system design
- Make thoughtful trade-offs
- Write maintainable code
- Think about scalability
- Care about security
- Communicate clearly
- Learn continuously
- Deliver results

You've demonstrated ALL of these with PayChain.

## Before You Present

- Take a deep breath
- Remember: You built something impressive
- Be confident (not arrogant)
- Show enthusiasm
- Be yourself
- Have fun with it

## If Things Go Wrong

"The best part about being a senior engineer isn't that things 
never break - it's that you know how to fix them and learn from 
them. Let me show you how I'd debug this..."

Then calmly show your problem-solving process.

## After the Demo

- Ask for feedback
- Discuss next steps
- Thank them for their time
- Follow up with GitHub link
- Send thank you email

---

You've got this! 🚀

Good luck with your demo!
````

---

## **APPENDIX: File Structure Summary**`

paychain/
├── frontend/                        # React application
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── pages/                  # Route pages
│   │   ├── contexts/               # React contexts
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API clients
│   │   └── utils/                  # Helper functions
│   └── package.json
│
├── backend/
│   ├── api_gateway/                # Port 8000
│   ├── user_service/               # Port 8001
│   ├── job_service/                # Port 8002
│   ├── payment_service/            # Port 8003
│   ├── websocket_server/           # Port 8080
│   └── shared/                     # Shared utilities
│
├── blockchain/
│   ├── contracts/
│   │   └── PayChainEscrow.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
│
├── database/
│   ├── init.sql                    # Schema creation
│   └── seed.sql                    # Demo data
│
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
│
├── scripts/
│   ├── setup-dev.sh
│   ├── start-demo.sh
│   └── reset-demo.sh
│
├── docs/
│   ├── ARCHITECTURE.md             # This document!
│   ├── SECURITY_NOTES.md
│   ├── API.md
│   └── DEMO_SCRIPT.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md

`---

## **CONCLUSION**

This architecture document provides everything you need to build and present PayChain successfully. 

**Key Takeaways:**
- ✅ True microservices with proper isolation
- ✅ Modern tech stack (React, FastAPI, PostgreSQL, Blockchain)
- ✅ Production-quality architecture (with demo pragmatism)
- ✅ Comprehensive security considerations
- ✅ Demo-ready features (user switching, time manipulation)
- ✅ Complete documentation
- ✅ CEO presentation strategy

**Next Steps:**
1. Review this document completely
2. Set up development environment (`./setup-dev.sh`)
3. Build the services following the specifications
4. Test thoroughly
5. Practice the demo
6. Crush the presentation! 💪

**Remember:** This demo showcases your ability to architect, build, and present complex full-stack systems. The CEO is evaluating your **thinking process and technical depth**, not just whether everything works perfectly.

**Good luck! You've got this! 🚀**`