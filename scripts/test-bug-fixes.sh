#!/bin/bash

# PayChain Bug Fixes - Quick Test Script
# This script rebuilds the frontend with all bug fixes and starts the services

set -e  # Exit on error

echo "🔧 PayChain Bug Fixes - Testing Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Rebuilding frontend with bug fixes...${NC}"
docker compose build frontend

echo ""
echo -e "${BLUE}🚀 Step 2: Starting all services...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}⏳ Step 3: Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo ""
echo -e "${YELLOW}Checking service health:${NC}"
echo ""

services=("ganache:8545" "postgres:5432" "redis:6379" "user-service:8001" "job-service:8002" "payment-service:8003" "api-gateway:8000" "frontend:3000")

for service in "${services[@]}"; do
    name="${service%:*}"
    port="${service#*:}"
    
    if docker compose ps | grep -q "$name.*Up"; then
        echo -e "${GREEN}✅ $name is running${NC}"
    else
        echo -e "${RED}❌ $name is not running${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}            TESTING THE BUG FIXES${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}1. Open browser:${NC} http://localhost:3000"
echo ""
echo -e "${BLUE}2. Test New User Registration:${NC}"
echo "   - Click 'Get Started' or 'Connect Wallet'"
echo "   - MetaMask will prompt to connect"
echo "   - If wallet is NEW → Registration modal appears"
echo "   - Fill in username, email, select user type"
echo "   - Complete registration"
echo ""
echo -e "${BLUE}3. Test Returning User Login:${NC}"
echo "   - Disconnect wallet and logout"
echo "   - Click 'Connect Wallet' again"
echo "   - If wallet is REGISTERED → Direct login (no modal)"
echo "   - Should see welcome message"
echo ""
echo -e "${BLUE}4. Test Dev Mode (Hidden Feature):${NC}"
echo "   - Press Ctrl+Shift+D"
echo "   - Dev panel appears in bottom-right"
echo "   - Click any demo account"
echo "   - Copy private key shown in toast"
echo "   - Import in MetaMask"
echo "   - Switch to imported account"
echo "   - Connect wallet → Auto-login"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 View logs:${NC} docker compose logs -f frontend"
echo -e "${BLUE}🛑 Stop all:${NC}  docker compose down"
echo ""
echo -e "${GREEN}Demo Accounts (for Dev Mode):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. TechStartupCo (Employer)"
echo "   Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo ""
echo "2. AliceDev (Worker)"
echo "   Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906"
echo ""
echo "Press Ctrl+Shift+D in the app to get private keys!"
echo ""
