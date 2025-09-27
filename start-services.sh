#!/bin/bash

# BookStore Services Startup Script
# Alternative to .NET Aspire when workload issues occur

set -e

echo "🚀 Starting BookStore Services..."
echo "=================================="

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to start..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done

    echo "❌ $service_name failed to start within timeout"
    return 1
}

# Check required ports
echo "🔍 Checking ports..."
check_port 7002 || exit 1
check_port 7004 || exit 1

# Start infrastructure with Docker Compose
echo "📦 Starting infrastructure (MongoDB, Redis)..."
docker-compose -f docker-compose.perf.yml up -d mongodb redis

# Wait for infrastructure
echo "⏳ Waiting for infrastructure..."
sleep 5

# Start BookStore API Service
echo "🔧 Starting BookStore API Service..."
cd BookStore.Service
dotnet run --urls "http://localhost:7002" > ../logs/bookstore-api.log 2>&1 &
BOOKSTORE_PID=$!
cd ..

# Start Performance Service
echo "🎯 Starting Performance Service..."
cd BookStore.Performance.Service
dotnet run --urls "http://localhost:7004" > ../logs/performance-service.log 2>&1 &
PERFORMANCE_PID=$!
cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs for cleanup
echo $BOOKSTORE_PID > logs/bookstore.pid
echo $PERFORMANCE_PID > logs/performance.pid

# Wait for services to be ready
wait_for_service "http://localhost:7002/health" "BookStore API"
wait_for_service "http://localhost:7004/health" "Performance Service"

echo ""
echo "🎉 All services are running!"
echo "=========================="
echo "📊 BookStore API:      http://localhost:7002"
echo "🔗 Swagger UI:         http://localhost:7002/swagger"
echo "⚡ Performance Service: http://localhost:7004"
echo "💾 MongoDB:            localhost:27017"
echo "🗄️  Redis:              localhost:6379"
echo ""
echo "📝 Logs are in ./logs/"
echo "🛑 To stop: ./stop-services.sh"
echo ""
echo "✨ Ready for testing!"