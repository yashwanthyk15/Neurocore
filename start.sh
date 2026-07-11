#!/bin/bash
echo "🚀 Starting NeuroCore..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v18+ from https://nodejs.org"
    exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 16 ]; then
    echo "❌ Node.js v16+ required. You have $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check .env
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "⚠️  No backend/.env found. Creating from template..."
    cp backend/.env.example backend/.env
    echo "📝 Please edit backend/.env and add your GEMINI_API_KEY"
    echo "   (App works without it, but text won't be AI-simplified)"
    echo ""
fi

# Install backend deps
echo "📦 Installing backend dependencies..."
cd backend && npm install --silent && cd ..

# Install frontend deps
echo "📦 Installing frontend dependencies..."
cd frontend && npm install --silent && cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Starting servers..."
echo "  Backend → http://localhost:5000"
echo "  Frontend → http://localhost:3000"
echo ""

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 3

# Start frontend
cd frontend && npm start
