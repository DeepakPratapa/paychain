#!/bin/bash

echo "🔍 PayChain Project Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

echo "📁 Root Configuration:"
check_file "docker-compose.yml"
check_file ".env.example"
check_file ".gitignore"
check_file "README.md"
check_file "PROJECT_STATUS.md"
check_file "BUILD_SUMMARY.md"

echo ""
echo "🗄️  Database:"
check_file "database/init.sql"
check_file "database/seed.sql"

echo ""
echo "⛓️  Blockchain:"
check_file "blockchain/contracts/PayChainEscrow.sol"
check_file "blockchain/hardhat.config.js"
check_file "blockchain/scripts/deploy.js"
check_file "blockchain/package.json"

echo ""
echo "🐍 Backend Services:"
check_file "backend/shared/config.py"
check_file "backend/shared/database.py"
check_file "backend/shared/auth.py"
check_file "backend/shared/schemas.py"
check_file "backend/user_service/main.py"
check_file "backend/job_service/main.py"
check_file "backend/payment_service/main.py"
check_file "backend/api_gateway/main.py"
check_file "backend/websocket_server/main.py"

echo ""
echo "⚛️  React Frontend:"
check_file "frontend/package.json"
check_file "frontend/vite.config.js"
check_file "frontend/src/App.jsx"
check_file "frontend/src/main.jsx"
check_file "frontend/src/contexts/AuthContext.jsx"
check_file "frontend/src/contexts/WalletContext.jsx"
check_file "frontend/src/pages/HomePage.jsx"
check_file "frontend/src/pages/DashboardPage.jsx"

echo ""
echo "🔧 Infrastructure:"
check_file "nginx/nginx.conf"
check_file "scripts/setup-dev.sh"
check_file "scripts/start-demo.sh"
check_file "scripts/reset-demo.sh"

echo ""
echo "📚 Documentation:"
check_file "docs/API.md"
check_file "docs/SECURITY_NOTES.md"

echo ""
echo "🐳 Docker Verification:"
if docker compose config --quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC} docker-compose.yml is valid"
else
    echo -e "${RED}✗${NC} docker-compose.yml has errors"
fi

echo ""
echo "📊 Project Statistics:"
echo "   - Docker version: $(docker --version | cut -d' ' -f3)"
echo "   - Docker Compose: $(docker compose version --short)"
echo "   - Total .py files: $(find backend -name "*.py" 2>/dev/null | wc -l)"
echo "   - Total .jsx files: $(find frontend/src -name "*.jsx" 2>/dev/null | wc -l)"
echo "   - Total scripts: $(find scripts -name "*.sh" 2>/dev/null | wc -l)"

echo ""
echo "=================================="
echo "✅ Verification Complete!"
