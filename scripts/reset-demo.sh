#!/bin/bash

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

# Stop services
echo "🛑 Stopping services..."
docker compose stop

# Remove volumes
echo "🗑️  Removing data volumes..."
docker volume rm paychain_postgres-data paychain_ganache-data paychain_redis-data 2>/dev/null || true

# Restart services
echo "🚀 Restarting services..."
docker compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 15

# Redeploy contract
echo "⛓️  Redeploying smart contract..."
cd blockchain
npx hardhat run scripts/deploy.js --network ganache
cd ..

echo ""
echo "✅ Demo reset complete!"
echo "🌐 Ready at: http://localhost:5173"
echo ""
