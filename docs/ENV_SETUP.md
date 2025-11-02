# Environment Variables Setup Guide

## Overview

PayChain uses **default configurations** that work out of the box. You **don't need** to create `.env` files for basic setup - the application will run with sensible defaults.

However, if you want to customize settings for production or specific environments, here's how:

---

## Quick Answer: No Setup Needed! ✅

For local development and demo purposes:
```bash
# Just clone and run - no .env files needed!
git clone https://github.com/DeepakPratapa/paychain.git
cd paychain
./scripts/setup-dev.sh
./scripts/start-demo.sh
```

The services use these defaults:
- **Database**: `postgresql://paychain:paychain@postgres:5432/paychain`
- **Redis**: `redis://redis:6379/0`
- **JWT Secret**: Auto-generated secure secret
- **Blockchain**: Local Hardhat network on port 8545

---

## Optional: Custom Configuration

If you need to override defaults (for production, testing, or custom setups):

### Backend Services

Create `.env` files in each backend service directory if needed:

#### `backend/api_gateway/.env`
```env
# Server
PORT=5000
HOST=0.0.0.0

# CORS - Update for production
CORS_ORIGINS=http://localhost:3000,http://localhost

# Service URLs (for service-to-service communication)
USER_SERVICE_URL=http://user-service:5001
JOB_SERVICE_URL=http://job-service:5002
PAYMENT_SERVICE_URL=http://payment-service:5003
```

#### `backend/user_service/.env`
```env
# Server
PORT=5001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://paychain:paychain@postgres:5432/paychain

# Redis (for token blacklist)
REDIS_URL=redis://redis:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Service API Key (for inter-service authentication)
SERVICE_API_KEY=your-service-to-service-secret-key
```

#### `backend/job_service/.env`
```env
# Server
PORT=5002
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://paychain:paychain@postgres:5432/paychain

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256

# Service API Key
SERVICE_API_KEY=your-service-to-service-secret-key

# WebSocket Server URL
WEBSOCKET_URL=http://websocket-server:5004
```

#### `backend/payment_service/.env`
```env
# Server
PORT=5003
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://paychain:paychain@postgres:5432/paychain

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256

# Service API Key
SERVICE_API_KEY=your-service-to-service-secret-key

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://hardhat:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# WebSocket Server URL
WEBSOCKET_URL=http://websocket-server:5004
```

#### `backend/websocket_server/.env`
```env
# Server
PORT=5004
HOST=0.0.0.0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost

# Redis (for pub/sub)
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
```

### Frontend

#### `frontend/.env`
```env
# API Gateway URL
VITE_API_URL=http://localhost:5000

# WebSocket Server URL
VITE_WS_URL=ws://localhost:5004

# Blockchain RPC URL
VITE_BLOCKCHAIN_RPC=http://localhost:8545

# Contract Address (will be updated after deployment)
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Environment
VITE_ENV=development
```

### Blockchain

#### `blockchain/.env`
```env
# Network Configuration
HARDHAT_NETWORK=localhost

# For production deployment (testnet/mainnet)
# PRIVATE_KEY=your-private-key-here
# INFURA_API_KEY=your-infura-key
# ETHERSCAN_API_KEY=your-etherscan-key
```

---

## Production Environment Variables

For production deployment, create `.env.production` files:

### Critical Settings to Change:

1. **JWT_SECRET_KEY**: Generate a strong random secret
   ```bash
   # Generate secure secret
   openssl rand -hex 32
   ```

2. **SERVICE_API_KEY**: Generate inter-service authentication key
   ```bash
   openssl rand -hex 32
   ```

3. **DATABASE_URL**: Use production database
   ```env
   DATABASE_URL=postgresql://user:password@production-db-host:5432/dbname
   ```

4. **CORS_ORIGINS**: Restrict to your domain
   ```env
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

5. **BLOCKCHAIN_RPC_URL**: Use production network
   ```env
   # For Ethereum mainnet via Infura
   BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
   
   # For Polygon Mumbai testnet
   BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
   ```

---

## Docker Compose Environment Variables

The `docker-compose.yml` file can also use a `.env` file at the root:

#### `.env` (root directory)
```env
# PostgreSQL
POSTGRES_USER=paychain
POSTGRES_PASSWORD=paychain
POSTGRES_DB=paychain

# Ports (if you need to change default ports)
FRONTEND_PORT=3000
API_GATEWAY_PORT=5000
USER_SERVICE_PORT=5001
JOB_SERVICE_PORT=5002
PAYMENT_SERVICE_PORT=5003
WEBSOCKET_PORT=5004
POSTGRES_PORT=5432
REDIS_PORT=6379
HARDHAT_PORT=8545
NGINX_PORT=80
```

---

## Environment Variable Priority

The application loads configuration in this order (highest priority first):

1. **Environment variables** set in shell
2. **`.env` files** in service directories
3. **Default values** in `backend/shared/config.py`

---

## Checking Current Configuration

### View Active Configuration
```bash
# Check what environment variables are set
docker-compose config

# View specific service environment
docker exec -it paychain-user-service env | grep DATABASE_URL
```

### View Default Configuration
```bash
# Check default settings in code
cat backend/shared/config.py
```

---

## Common Scenarios

### Scenario 1: Local Development (Default)
**No .env files needed!** Just run:
```bash
./scripts/start-demo.sh
```

### Scenario 2: Custom Database
Create `backend/user_service/.env`:
```env
DATABASE_URL=postgresql://myuser:mypass@localhost:5432/mydb
```

Also update for `job_service` and `payment_service`.

### Scenario 3: Production Deployment
1. Create `.env` in each service directory
2. Set all secrets using secure random values
3. Update CORS origins to your domain
4. Use managed database and Redis services
5. Deploy to production blockchain network

### Scenario 4: Different Port Numbers
Create `.env` in root directory:
```env
FRONTEND_PORT=8080
API_GATEWAY_PORT=8000
NGINX_PORT=8888
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## Security Best Practices

### ⚠️ NEVER commit `.env` files to Git!

The `.gitignore` already excludes them:
```gitignore
.env
.env.local
.env.production
*.env
```

### For Production:

1. **Use Environment Variable Management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Docker Secrets
   - Kubernetes Secrets

2. **Generate Strong Secrets**
   ```bash
   # JWT Secret
   openssl rand -hex 32
   
   # Service API Key
   openssl rand -hex 32
   ```

3. **Rotate Secrets Regularly**
   - Change JWT secrets periodically
   - Update database passwords
   - Rotate API keys

4. **Restrict Database Access**
   - Use read-only users where possible
   - Limit database connections
   - Enable SSL/TLS for database connections

---

## Troubleshooting

### Service Can't Connect to Database
```bash
# Check DATABASE_URL is correct
docker exec -it paychain-user-service env | grep DATABASE_URL

# Verify database is running
docker-compose ps postgres

# Test database connection
docker exec -it paychain-postgres psql -U paychain -d paychain -c "SELECT 1;"
```

### JWT Token Issues
```bash
# Ensure JWT_SECRET_KEY is the same across all services
docker exec -it paychain-user-service env | grep JWT_SECRET_KEY
docker exec -it paychain-job-service env | grep JWT_SECRET_KEY
```

### CORS Errors
```bash
# Check CORS_ORIGINS includes your frontend URL
docker exec -it paychain-api-gateway env | grep CORS_ORIGINS
```

### Service-to-Service Communication Fails
```bash
# Verify SERVICE_API_KEY matches across services
docker exec -it paychain-user-service env | grep SERVICE_API_KEY
docker exec -it paychain-job-service env | grep SERVICE_API_KEY
```

---

## Quick Reference

### Required for Production:
- ✅ `JWT_SECRET_KEY` - Strong random value
- ✅ `SERVICE_API_KEY` - Strong random value
- ✅ `DATABASE_URL` - Production database
- ✅ `CORS_ORIGINS` - Your domain only

### Optional (Has Defaults):
- `PORT` - Service ports
- `REDIS_URL` - Redis connection
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiry
- `BLOCKCHAIN_RPC_URL` - Blockchain network

### Never Set (Auto-configured):
- `CONTRACT_ADDRESS` - Set after deployment
- Internal service URLs - Handled by Docker networking

---

## Summary

**For Local Development/Demo:**
```bash
# No .env files needed - just run!
./scripts/setup-dev.sh
./scripts/start-demo.sh
```

**For Production:**
```bash
# 1. Create .env files in each service
# 2. Set secure secrets
# 3. Update CORS origins
# 4. Use production database and blockchain
# 5. Deploy with proper secret management
```

The application is designed to work immediately with sensible defaults, making it easy to demo and deploy! 🚀
