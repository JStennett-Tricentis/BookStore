#!/bin/bash
#
# Aspire Startup Script with MongoDB Volume Cleanup
# Prevents authentication issues by cleaning stale volumes before start
#

set -e

echo "🚀 Starting BookStore with .NET Aspire..."
echo ""

# Clean MongoDB volumes to prevent auth issues
echo "🧹 Cleaning MongoDB volumes..."
docker volume ls | grep "mongodb-data" | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || true
echo "✓ MongoDB volumes cleaned"
echo ""

# Build the solution
echo "📦 Building solution..."
dotnet build
echo "✓ Build complete"
echo ""

# Start Aspire
echo "▶️  Starting Aspire..."
echo "📊 Aspire Dashboard: http://localhost:15888"
echo "📈 Grafana: http://localhost:3000 (admin/admin123)"
echo "🔍 Prometheus: http://localhost:9090"
echo "📖 BookStore API: http://localhost:7002/swagger"
echo ""

cd BookStore.Aspire.AppHost
ASPNETCORE_URLS="http://localhost:15888" \
DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL="http://localhost:19999" \
ASPIRE_ALLOW_UNSECURED_TRANSPORT=true \
dotnet run
