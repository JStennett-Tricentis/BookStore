#!/bin/bash
# Clean start script for Aspire with API Simulator

set -e

echo "🧹 Cleaning up..."

# Kill any running dotnet processes
pkill -f "dotnet run" 2>/dev/null || true
sleep 2

# Remove old containers
docker ps -a | grep -E "api-simulator|aspire|mongodb|redis|prometheus|grafana" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Remove old networks
docker network ls | grep aspire | awk '{print $1}' | xargs -r docker network rm 2>/dev/null || true

# Clean temp files
rm -f /tmp/aspire-*.log

echo "✅ Cleanup complete"
echo ""
echo "🚀 Starting Aspire..."
echo ""

# Start with clean environment
ASPNETCORE_URLS="http://localhost:15888" \
DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL="http://localhost:18889" \
ASPIRE_ALLOW_UNSECURED_TRANSPORT=true \
dotnet run

