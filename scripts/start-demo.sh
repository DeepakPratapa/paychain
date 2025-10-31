#!/bin/bash

echo "🎬 Starting PayChain Demo..."

# Check if already running
if docker compose ps | grep -q "Up"; then
    echo "⚠️  Services already running!"
    echo "Restarting..."
    docker compose restart
    
    # Wait for Ganache
    echo "⏳ Waiting for Ganache..."
    sleep 5
else
    echo "🚀 Starting services..."
    docker compose up -d
    
    # Wait for Ganache to be ready
    echo "⏳ Waiting for Ganache to be ready..."
    max_attempts=30
    attempt=0
    until curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        --max-time 2 \
        http://localhost:8545 2>/dev/null | grep -q "result"; do
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Ganache failed to start"
            exit 1
        fi
        sleep 1
    done
    
    echo "✅ Ganache is ready"
fi

# Deploy smart contract
echo ""
echo "⛓️  Deploying smart contract..."
cd "$(dirname "$0")/.."
if [ -d "blockchain" ]; then
    cd blockchain
    if npx hardhat run scripts/deploy.js --network localhost; then
        echo "✅ Smart contract deployed"
        cd ..
        
        # Restart payment service to pick up new contract address
        echo "🔄 Restarting payment and job services..."
        docker compose restart payment-service job-service
    else
        echo "❌ Contract deployment failed"
        cd ..
        exit 1
    fi
else
    echo "❌ Blockchain directory not found"
    exit 1
fi

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 8

# Check health
echo ""
echo "🏥 Health Check:"
echo "==============="

# API Gateway
if curl -sf http://localhost:8000/health > /dev/null; then
    echo "✅ API Gateway: Online"
else
    echo "❌ API Gateway: Offline"
fi

# PostgreSQL
if docker compose exec -T postgres pg_isready -U paychain_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Connected"
else
    echo "❌ PostgreSQL: Disconnected"
fi

# Ganache
if curl -sf -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 2>/dev/null | grep -q "result"; then
    echo "✅ Ganache: Online"
else
    echo "❌ Ganache: Offline"
fi

# Redis
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Online"
else
    echo "❌ Redis: Offline"
fi

# Payment Service
if curl -sf http://localhost:8004/health > /dev/null; then
    echo "✅ Payment Service: Online"
else
    echo "❌ Payment Service: Offline"
fi

echo ""
echo "🎉 PayChain is ready for demo!"
echo ""
echo "🌐 Open: http://localhost:5173"
echo "🛠️  Dev Tools: Press Ctrl+Shift+D"
echo ""
echo "📊 View logs: docker compose logs -f"
echo ""
