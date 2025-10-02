#!/bin/bash
#
# Aspire Startup Script with MongoDB Volume Cleanup
# Prevents authentication issues by cleaning stale volumes before start
#

set -e

# Set up .NET environment to support both .NET 8 and .NET 9
# Use .NET 9 SDK for building (supports both .NET 8 and .NET 9 projects)
# .NET 8 runtime is available at /opt/homebrew/opt/dotnet@8/libexec
export PATH="/opt/homebrew/Cellar/dotnet/9.0.6/libexec:$PATH"
export DOTNET_ROOT="/opt/homebrew/Cellar/dotnet/9.0.6/libexec"

echo "🚀 Starting BookStore with .NET Aspire..."
echo ""

# Complete cleanup: remove old containers AND volumes to ensure fresh start
echo "🧹 Cleaning up old Docker resources..."
# Stop and remove MongoDB containers
docker ps -a | grep mongo | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true
# Remove MongoDB volumes
docker volume ls | grep -E "mongodb|aspire.*mongo" | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || true
echo "✓ Docker cleanup complete"
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

# Run Aspire and capture output to extract token
ASPNETCORE_URLS="http://localhost:15888" \
DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL="http://localhost:19999" \
ASPIRE_ALLOW_UNSECURED_TRANSPORT=true \
dotnet run 2>&1 | tee >(
  # Extract and display the dashboard login URL
  SEEDED=false
  while IFS= read -r line; do
    if [[ "$line" == *"Login to the dashboard at"* ]]; then
      LOGIN_URL=$(echo "$line" | grep -oE 'http://[^[:space:]]+')
      echo ""
      echo "════════════════════════════════════════════════════════════════"
      echo "🔑 ASPIRE DASHBOARD LOGIN"
      echo "════════════════════════════════════════════════════════════════"
      echo "$LOGIN_URL"
      echo "════════════════════════════════════════════════════════════════"
      echo ""
      # Open the login URL with token
      sleep 2 && open "$LOGIN_URL" &
    fi

    # Auto-seed database once services are ready
    if [[ "$line" == *"Distributed application started"* ]] && [[ "$SEEDED" == "false" ]]; then
      SEEDED=true
      (
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        echo "🌱 Auto-seeding database..."
        SEED_RESPONSE=$(curl -s -X POST http://localhost:7002/seed-data -H "Content-Type: application/json" 2>&1)
        if [[ "$SEED_RESPONSE" == *"success"* ]]; then
          echo "✅ Database seeded successfully"
        else
          echo "⚠️  Database seeding failed or already seeded"
        fi
        echo ""
      ) &
    fi
  done
)
