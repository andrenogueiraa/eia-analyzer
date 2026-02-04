#!/bin/bash

# EIA Analyzer - Development Server Launcher
# Starts all 3 services in parallel

set -e

echo "🚀 Starting EIA Analyzer Development Environment..."
echo ""

# Colors
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Kill any existing processes on ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Create log directory
mkdir -p logs

# Start API server
echo -e "${CYAN}[API]${NC} Starting API server on http://localhost:3001..."
cd api && bun run api > ../logs/api.log 2>&1 &
API_PID=$!
cd ..

# Wait a bit for API to start
sleep 2

# Start Convex dev
echo -e "${MAGENTA}[CONVEX]${NC} Starting Convex dev server..."
cd web && bunx convex dev > ../logs/convex.log 2>&1 &
CONVEX_PID=$!
cd ..

# Wait for Convex to initialize
sleep 3

# Start Web dev
echo -e "${GREEN}[WEB]${NC} Starting Vite dev server on http://localhost:5173..."
cd web && bun dev > ../logs/web.log 2>&1 &
WEB_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Services:"
echo -e "  ${CYAN}API:${NC}     http://localhost:3001 (PID: $API_PID)"
echo -e "  ${MAGENTA}Convex:${NC}  Running in background (PID: $CONVEX_PID)"
echo -e "  ${GREEN}Web:${NC}     http://localhost:5173 (PID: $WEB_PID)"
echo ""
echo "📝 Logs:"
echo "  tail -f logs/api.log"
echo "  tail -f logs/convex.log"
echo "  tail -f logs/web.log"
echo ""
echo "🛑 To stop all services: ./stop.sh or press Ctrl+C"
echo ""

# Function to handle cleanup
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  kill $API_PID 2>/dev/null || true
  kill $CONVEX_PID 2>/dev/null || true
  kill $WEB_PID 2>/dev/null || true
  echo "✅ All services stopped"
  exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for all background processes
wait
