#!/bin/bash

echo "🚀 PayChain Development Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Generate secrets
echo "🔐 Generating secure secrets..."

JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
USER_SERVICE_KEY=$(openssl rand -hex 16)
JOB_SERVICE_KEY=$(openssl rand -hex 16)
PAYMENT_SERVICE_KEY=$(openssl rand -hex 16)

# Create .env from template
cp .env.example .env

# Ganache test private key (account #0 - DO NOT USE IN PRODUCTION)
GANACHE_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Replace placeholders using | delimiter to avoid issues with special characters
sed -i "s|CHANGE_ME_POSTGRES_PASSWORD|$POSTGRES_PASSWORD|g" .env
sed -i "s|CHANGE_ME_JWT_SECRET|$JWT_SECRET|g" .env
sed -i "s|CHANGE_ME_USER_SERVICE_KEY|$USER_SERVICE_KEY|g" .env
sed -i "s|CHANGE_ME_JOB_SERVICE_KEY|$JOB_SERVICE_KEY|g" .env
sed -i "s|CHANGE_ME_PAYMENT_SERVICE_KEY|$PAYMENT_SERVICE_KEY|g" .env
sed -i "s|CHANGE_ME_USE_SEPARATE_PRODUCTION_WALLET|$GANACHE_PRIVATE_KEY|g" .env

echo "✅ Secrets generated and saved to .env"

# Build Docker images
echo ""
echo "🐳 Building Docker images..."
docker compose build

echo ""
echo "📦 Starting infrastructure services..."
docker compose up -d postgres redis ganache

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

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
        echo "❌ Ganache failed to start after $max_attempts attempts"
        exit 1
    fi
    sleep 1
done

echo ""
echo "✅ Infrastructure services started"

# Deploy smart contract
echo ""
echo "⛓️  Deploying smart contract to Ganache..."
cd blockchain
npm install
npx hardhat run scripts/deploy.js --network localhost
cd ..

# Start all services
echo ""
echo "🚀 Starting all services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 10

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
echo "📝 To view logs: docker compose logs -f"
echo "🛑 To stop: docker compose down"
echo "🔄 To restart: docker compose restart"
echo ""
