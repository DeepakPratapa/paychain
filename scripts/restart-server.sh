#!/bin/bash

# Restart Server Script
# This script stops all containers, removes volumes, sets up the dev environment, and starts the demo

set -e  # Exit on error

echo "🛑 Stopping containers and removing volumes..."
docker compose down -v

echo ""
echo "⚙️  Setting up development environment..."
./scripts/setup-dev.sh

echo ""
echo "🚀 Starting demo..."
./scripts/start-demo.sh

echo ""
echo "✅ Server restart complete!"
