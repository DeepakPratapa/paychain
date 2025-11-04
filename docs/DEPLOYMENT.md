# PayChain Deployment Guide

## Quick Setup on New Server

This guide will help you deploy PayChain on a fresh server using the GitHub repository.

---

## Prerequisites

### Required Software
- **Git** - For cloning the repository
- **Docker** & **Docker Compose** - For containerization
- **Node.js 18+** & **npm** - For blockchain scripts
- **MetaMask** - Browser extension for wallet interaction

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **RAM**: Minimum 4GB
- **Disk Space**: 10GB free space
- **Ports**: 80, 3000, 5000-5004, 5432, 8545

---

## Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/DeepakPratapa/paychain.git
cd paychain
```

---

## Step 2: Install Dependencies

### Install Docker (Ubuntu/Debian)
```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (avoid using sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Install Node.js (for blockchain)
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 3: Configure Environment

### Backend Services Configuration

The project uses default configurations that work out of the box. If you need to customize:

1. **Database**: PostgreSQL runs in Docker (no manual setup needed)
2. **Redis**: Runs in Docker for token blacklist
3. **Blockchain**: Local Hardhat network in Docker

### Optional: Custom Configuration

If you need to change default settings, check these files:
- `backend/shared/config.py` - Database, Redis, JWT settings
- `frontend/src/config/index.js` - API endpoints
- `blockchain/hardhat.config.js` - Blockchain network settings

---

## Step 4: Setup Development Environment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run the setup script (installs blockchain dependencies, compiles contracts)
./scripts/setup-dev.sh
```

This script will:
- Install blockchain npm packages
- Compile smart contracts
- Set up the local Hardhat network
- Deploy the PayChain escrow contract

---

## Step 5: Start the Application

```bash
# Start all services with Docker Compose
./scripts/start-demo.sh
```

This will start:
- PostgreSQL database
- Redis cache
- Hardhat blockchain node
- API Gateway (port 5000)
- User Service (port 5001)
- Job Service (port 5002)
- Payment Service (port 5003)
- WebSocket Server (port 5004)
- Frontend React app (port 3000)
- Nginx reverse proxy (port 80)

---

## Step 6: Verify Deployment

### Check Running Containers
```bash
docker-compose ps
```

You should see all services running:
- `paychain-postgres`
- `paychain-redis`
- `paychain-hardhat`
- `paychain-api-gateway`
- `paychain-user-service`
- `paychain-job-service`
- `paychain-payment-service`
- `paychain-websocket-server`
- `paychain-frontend`
- `paychain-nginx`

### Check Service Health
```bash
# API Gateway
curl http://localhost:5000/health

# User Service
curl http://localhost:5001/health

# Job Service
curl http://localhost:5002/health

# Payment Service
curl http://localhost:5003/health
```

### Access the Application
Open your browser and navigate to:
- **Frontend**: http://localhost (or http://localhost:3000)
- **API Gateway**: http://localhost:5000

---

## Step 7: Setup MetaMask

### Add Local Network to MetaMask

1. Open MetaMask extension
2. Click network dropdown → "Add Network" → "Add network manually"
3. Enter the following details:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
4. Click "Save"

### Import Test Accounts

Hardhat provides test accounts with ETH. Import Account #0 and #1:

**Account #0 (Employer):**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Account #1 (Worker):**
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

To import:
1. MetaMask → Click account icon → "Import Account"
2. Paste the private key
3. Click "Import"

---

## Step 8: Test the Application

### Create Test Users

1. **Create Employer Account**:
   - Switch to Account #0 in MetaMask
   - Click "Sign in with MetaMask"
   - Sign the message
   - Fill in username, select "Employer"
   - Complete signup

2. **Create Worker Account**:
   - Switch to Account #1 in MetaMask
   - Sign in and complete signup as "Worker"

### Test Core Features

1. **As Employer**:
   - Create a new job
   - Fund it with test ETH
   - Watch job appear in dashboard

2. **As Worker**:
   - Browse available jobs
   - Accept a job
   - Complete the job

3. **Real-time Notifications**:
   - Open two browser windows (Employer & Worker)
   - Watch notifications appear instantly

---

## Useful Commands

### Restart Everything
```bash
./scripts/restart-server.sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f job-service
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (Fresh Start)
```bash
docker-compose down -v
```

### Check Database
```bash
# Connect to PostgreSQL
docker exec -it paychain-postgres psql -U paychain -d paychain

# View tables
\dt

# View users
SELECT id, username, user_type, wallet_address FROM users;

# Exit
\q
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port (e.g., 3000)
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

### Frontend Can't Connect to Backend
- Check that all backend services are running: `docker-compose ps`
- Verify API Gateway is accessible: `curl http://localhost:5000/health`
- Check frontend config: `frontend/src/config/index.js`

### Blockchain Connection Issues
- Ensure Hardhat container is running
- Verify MetaMask is connected to `http://localhost:8545`
- Check contract deployment: `docker-compose logs hardhat`

### Database Connection Issues
```bash
# Recreate database
docker-compose down -v
./scripts/setup-dev.sh
./scripts/start-demo.sh
```

---

## Production Deployment Notes

For production deployment, you'll need to:

1. **Use Production Database**
   - Set up managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
   - Update `DATABASE_URL` in backend services

2. **Use Production Blockchain**
   - Deploy to testnet (Sepolia, Mumbai) or mainnet
   - Update RPC URLs and chain IDs
   - Secure private keys properly

3. **Configure Domain & SSL**
   - Point domain to server IP
   - Set up SSL certificates (Let's Encrypt)
   - Update CORS settings

4. **Environment Variables**
   - Set production JWT secrets
   - Configure Redis for production
   - Set proper CORS origins

5. **Security**
   - Use environment variables for secrets
   - Enable firewall rules
   - Set up monitoring and logging
   - Implement rate limiting

6. **Scaling**
   - Use container orchestration (Kubernetes, Docker Swarm)
   - Set up load balancers
   - Configure auto-scaling

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (Port 80)                  │
│              Reverse Proxy & Load Balancer          │
└─────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Frontend   │  │ API Gateway  │  │  WebSocket   │
│  React App   │  │  (Port 5000) │  │   Server     │
│ (Port 3000)  │  └──────────────┘  │ (Port 5004)  │
└──────────────┘         │           └──────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ User Service │  │ Job Service  │  │   Payment    │
│ (Port 5001)  │  │ (Port 5002)  │  │   Service    │
└──────────────┘  └──────────────┘  │ (Port 5003)  │
        │                │           └──────────────┘
        └────────────────┼────────────────┘
                         ▼
        ┌────────────────────────────────┐
        │     PostgreSQL Database        │
        │         (Port 5432)            │
        └────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                                 ▼
┌──────────────┐              ┌──────────────────┐
│    Redis     │              │  Hardhat Node    │
│ (Port 6379)  │              │   (Port 8545)    │
└──────────────┘              └──────────────────┘
```

---

## Tech Stack Summary

- **Frontend**: React 18, TanStack Query, Tailwind CSS, WebSockets
- **Backend**: Python FastAPI, 5 Microservices, JWT Auth
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis for token blacklist
- **Blockchain**: Ethereum (Hardhat), Solidity Smart Contracts
- **Real-time**: WebSocket Server with Socket.io
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx

---

## Support & Documentation

- **README**: [README.md](./README.md)
- **API Documentation**: [docs/API.md](./docs/API.md)
<!-- - **Architecture**: [docs/Architecture.md](./docs/Architecture.md) -->
- **Security**: [docs/SECURITY_README.md](./docs/SECURITY_README.md)

---

## Quick Reference Commands

```bash
# Clone and setup
git clone https://github.com/DeepakPratapa/paychain.git
cd paychain
./scripts/setup-dev.sh

# Start application
./scripts/start-demo.sh

# Restart everything
./scripts/restart-server.sh

# View logs
docker-compose logs -f

# Stop everything
docker-compose down -v
```

---

**You're all set!** 🎉

The application should now be running and accessible at http://localhost
