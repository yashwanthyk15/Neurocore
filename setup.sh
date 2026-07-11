#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   NeuroCore — Setup Script           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Install backend deps
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend dependencies installed"

# Install frontend deps
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo "✅ Frontend dependencies installed"

# Setup .env
cd ../backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚙️  Created backend/.env from template"
    echo ""
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│  ACTION REQUIRED: Edit backend/.env and add:            │"
    echo "│                                                          │"
    echo "│  MONGODB_URI=your_mongodb_connection_string             │"
    echo "│  GEMINI_API_KEY=your_gemini_api_key                     │"
    echo "│  JWT_SECRET=any_long_random_string                      │"
    echo "└─────────────────────────────────────────────────────────┘"
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Setup complete! To start NeuroCore:                        ║"
echo "║                                                              ║"
echo "║  Terminal 1: cd backend && npm run dev                      ║"
echo "║  Terminal 2: cd frontend && npm start                       ║"
echo "║                                                              ║"
echo "║  Then open: http://localhost:3000                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
