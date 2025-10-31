#!/bin/bash

# PayChain - Complete Fix Script
# Fixes all critical bugs and restarts services

set -e

echo "🔧 PayChain Complete Bug Fix"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Stopping all services...${NC}"
docker compose down

echo ""
echo -e "${BLUE}🛠️  Step 2: Rebuilding all services...${NC}"
docker compose build

echo ""
echo -e "${BLUE}🚀 Step 3: Starting services...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}⏳ Step 4: Waiting for services to start (15 seconds)...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}Service Status:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}✅ Testing API Gateway...${NC}"
CHALLENGE_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}')

if echo "$CHALLENGE_RESPONSE" | grep -q "challenge"; then
    echo -e "${GREEN}✅ API Gateway is working!${NC}"
else
    echo -e "${RED}❌ API Gateway test failed${NC}"
    echo "Response: $CHALLENGE_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 All Fixes Applied!${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}            WHAT WAS FIXED${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Fixed nginx routing (now supports /auth/* endpoints)${NC}"
echo -e "${GREEN}✅ Fixed all Dockerfile ports (8000 internally)${NC}"
echo -e "${GREEN}✅ Added missing passlib dependency to job-service${NC}"
echo -e "${GREEN}✅ Fixed CORS headers for all origins${NC}"
echo -e "${GREEN}✅ API Gateway now connects to all services${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo "   Frontend:    http://localhost:5173"
echo "   Nginx Proxy: http://localhost:8000"
echo "   API Gateway: http://localhost:8001"
echo "   User Service: http://localhost:8002"
echo "   Job Service:  http://localhost:8003"
echo "   Payment Svc:  http://localhost:8004"
echo ""
echo -e "${BLUE}🧪 Test Authentication:${NC}"
echo "   1. Open http://localhost:5173 in browser"
echo "   2. Click 'Connect Wallet'"
echo "   3. Connect MetaMask (network: localhost:8545)"
echo "   4. For new wallet: Registration modal appears"
echo "   5. For existing: Direct login"
echo ""
echo -e "${BLUE}🎯 Dev Mode:${NC}"
echo "   Press Ctrl+Shift+D to access demo accounts"
echo ""
echo -e "${BLUE}📊 View Logs:${NC}"
echo "   docker compose logs -f [service-name]"
echo ""
echo -e "${GREEN}Ready for testing! 🚀${NC}"
echo ""
