#!/bin/bash
set -e

echo "=== RCCB Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed."; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Node.js 20+ required. Current: $(node -v)"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build shared types
echo "Building shared types..."
npm run build -w shared

# Create .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created from .env.example"
fi

# Create data directories
mkdir -p data uploads certs

# Build everything
echo "Building project..."
npm run build

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start in dev mode:  npm run dev"
echo "To start in prod mode: npm start"
echo ""
echo "On first access, call POST /api/auth/setup to generate your access token."
echo ""
