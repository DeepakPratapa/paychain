# PayChain - Quick Start Guide

## System Requirements

✅ **Verified Compatible:**
- Docker Engine: v28.5.1 (or v20.10+)
- Docker Compose: v2.40.2 (or v2.0+)
- Node.js: v18+ (for blockchain development)
- 8GB RAM minimum
- 10GB free disk space

## 🚀 Launch PayChain in 3 Steps

### Step 1: Initial Setup (One-time)

```bash
cd paychain

# Generate secrets, build containers, deploy smart contract
./scripts/setup-dev.sh
```

**What this does:**
- Generates secure random secrets (JWT, PostgreSQL password, API keys)
- Creates `.env` file from `.env.example`
- Installs blockchain dependencies
- Builds all Docker images
- Deploys PayChainEscrow smart contract to Ganache
- Saves contract address and ABI

**Duration:** 5-10 minutes (first time only)

### Step 2: Start All Services

```bash
./scripts/start-demo.sh
```

**What this starts:**
- 🐘 PostgreSQL database (with schema and seed data)
- 🔴 Redis cache
- ⛓️  Ganache blockchain
- 🐍 5 Python microservices
- ⚛️  React frontend
- 🔄 Nginx reverse proxy

**Duration:** 2-3 minutes

### Step 3: Access the Application

Open your browser to:
- **Frontend:** http://localhodt:3000
- **API Gateway:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 📱 Using the Demo

### Connect MetaMask

1. Install MetaMask browser extension
2. Import account using the mnemonic:
   ```
   test test test test test test test test test test test junk
   ```
3. Add Ganache network:
   - Network Name: `Ganache Local`
   - RPC URL: `http://localhost:8545` (or `http://127.0.0.1:8545` if localhost doesn't work)
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

**Troubleshooting MetaMask Connection:**
- If MetaMask can't connect to `http://localhost:8545`, try `http://127.0.0.1:8545`
- Ensure Ganache container is running: `docker compose ps ganache`
- Test RPC: `curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'`
- If you see `ERR_CONNECTION_REFUSED`, restart Ganache: `docker compose restart ganache`

### Demo Accounts

**Employers (can create jobs):**
- Alice: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Bob: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`

**Workers (can accept jobs):**
- Charlie: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- David: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- Eve: `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955`

All accounts have 1000 ETH balance on Ganache.

### Workflow Example

**As Employer (Alice):**
1. Connect wallet with Alice's address
2. Click "Connect Wallet" → Sign challenge with MetaMask
3. Go to "Create Job"
4. Fill in job details (title, description, price, time limit)
5. Add checklist items (optional)
6. Click "Create Job" → Confirm MetaMask transaction
7. Funds locked in escrow smart contract

**As Worker (Charlie):**
1. Switch MetaMask to Charlie's address
2. Connect wallet and login
3. Go to "Browse Jobs"
4. Click on a job → "Accept This Job"
5. Update checklist as you complete tasks
6. When done, click "Submit Work"

**As Employer (Alice):**
1. Switch back to Alice's address
2. Go to job details
3. Review submitted work
4. Click "Approve & Release Payment"
5. Worker receives 98% of payment (2% platform fee)

## 🛠️ Management Commands

```bash
# View logs from all services
docker compose logs -f

# View specific service logs
docker compose logs -f user-service
docker compose logs -f frontend

# Restart a service
docker compose restart job-service

# Stop all services
docker compose down

# Reset everything (remove all data)
./scripts/reset-demo.sh

# Restart with fresh data
./scripts/reset-demo.sh
./scripts/setup-dev.sh
./scripts/start-demo.sh
```

## 🔍 Troubleshooting

### Port Already in Use

If you see "port already allocated" errors:

```bash
# Check what's using the ports
sudo lsof -i :3000  # Frontend
sudo lsof -i :8000  # API Gateway
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :8545  # Ganache

# Kill the process or change ports in docker-compose.yml
```

### Containers Won't Start

```bash
# Check Docker daemon is running
sudo systemctl status docker

# View detailed error logs
docker compose logs

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Connection Errors

```bash
# Check PostgreSQL health
docker compose ps postgres

# Reset database
docker compose down -v  # Remove volumes
docker compose up -d postgres

# View database logs
docker compose logs postgres
```

### Smart Contract Not Deployed

```bash
# Redeploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network ganache

# Check contract address in .env
grep CONTRACT_ADDRESS .env
```

### Frontend Won't Connect to MetaMask

1. Ensure MetaMask is unlocked
2. Check you're on Ganache network (Chain ID 1337)
3. Open browser console for errors
4. Clear MetaMask activity data: Settings → Advanced → Clear activity

## 📊 Service Health Checks

```bash
# Check all services
docker compose ps

# Health check endpoints
curl http://localhost:8002/health  # User Service
curl http://localhost:8003/health  # Job Service
curl http://localhost:8004/health  # Payment Service

# Database connection
docker compose exec postgres psql -U paychain_user -d paychain -c "SELECT COUNT(*) FROM users;"

# Blockchain connection
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 🔐 Security Notes

⚠️ **THIS IS A DEMO** - Not production-ready!

- Uses local testnet with known mnemonic
- No HTTPS/TLS encryption
- Hardcoded secrets in .env
- See `docs/SECURITY_NOTES.md` for full details

**Never use with real funds or deploy publicly!**

## 📚 Additional Resources

- **API Documentation:** `docs/API.md`
- **Security Analysis:** `docs/SECURITY_NOTES.md`
- **Architecture Details:** `BUILD_SUMMARY.md`
- **Development Status:** `PROJECT_STATUS.md`

## 🆘 Getting Help

If you encounter issues:

1. Check service logs: `docker compose logs [service-name]`
2. Verify all files exist: `./verify-setup.sh`
3. Reset and try again: `./scripts/reset-demo.sh`
4. Review error messages in browser console

## 🎯 What's Next?

After the demo is running:

1. **Explore the UI** - Create jobs, accept work, release payments
2. **Check the blockchain** - View transactions in Ganache
3. **Test real-time updates** - Open multiple browser windows
4. **Review the code** - Study the microservices architecture
5. **Read the docs** - Understand security and production requirements

---

**Enjoy your PayChain demo!** 🎉
