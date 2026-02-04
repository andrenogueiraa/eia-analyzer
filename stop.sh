#!/bin/bash

# EIA Analyzer - Stop all development servers

echo "🛑 Stopping all development services..."

# Kill by port
echo "  Stopping API (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "  Stopping Web (port 5173)..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Kill by process name
echo "  Stopping Convex..."
pkill -f "convex dev" 2>/dev/null || true

echo "  Stopping Bun processes..."
pkill -f "bun run api" 2>/dev/null || true
pkill -f "bun dev" 2>/dev/null || true

echo ""
echo "✅ All services stopped!"
