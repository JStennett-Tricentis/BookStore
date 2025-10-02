#!/bin/bash

# BookStore Services Stop Script

echo "🛑 Stopping BookStore Services..."
echo "================================="

# Stop .NET services using PIDs
if [ -f logs/bookstore.pid ]; then
    echo "🔧 Stopping BookStore API Service..."
    kill $(cat logs/bookstore.pid) 2>/dev/null || echo "   BookStore API already stopped"
    rm -f logs/bookstore.pid
fi

if [ -f logs/performance.pid ]; then
    echo "🎯 Stopping Performance Service..."
    kill $(cat logs/performance.pid) 2>/dev/null || echo "   Performance Service already stopped"
    rm -f logs/performance.pid
fi

# Stop any remaining dotnet processes
echo "🧹 Cleaning up any remaining processes..."
pkill -f "dotnet run" 2>/dev/null || true

# Stop Docker infrastructure
echo "📦 Stopping infrastructure..."
docker-compose -f docker-compose.perf.yml down

echo ""
echo "✅ All services stopped!"
echo ""