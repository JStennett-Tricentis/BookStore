# Aspire + API Simulator Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Slow UI / Sluggish Performance

**Symptoms**:

- Aspire Dashboard takes a long time to load
- UI is unresponsive
- High CPU/memory usage

**Causes**:

- Too many accumulated containers from previous runs
- Multiple Aspire instances running
- API Simulator enabled with resource constraints

**Solution**:

```bash
# Use the clean start script
cd BookStore.Aspire.AppHost
./clean-start.sh

# OR manually clean up
pkill -f "dotnet run"
docker ps -a | grep -E "aspire|api-simulator|mongodb|redis|prometheus|grafana" | awk '{print $1}' | xargs -r docker rm -f
docker network prune -f
```

---

### Issue 2: API Simulator Failed State

**Symptoms**:

- Container shows as "Failed" in Aspire Dashboard
- 502 errors when accessing simulator UI
- Platform warnings about linux/amd64 on ARM64

**Causes**:

- ARM64 emulation overhead
- File permission issues
- Port conflicts

**Solution 1** - Disable API Simulator (Recommended for development):

```json
// BookStore.Aspire.AppHost/appsettings.json
{
  "ApiSimulatorEnabled": false // <-- Set to false
}
```

**Solution 2** - Fix and Restart:

```bash
# Remove failed container
docker ps -a | grep api-simulator | awk '{print $1}' | xargs docker rm -f

# Restart Aspire
cd BookStore.Aspire.AppHost
./clean-start.sh
```

---

### Issue 3: Database Seeding Failed

**Symptoms**:

```text
⚠️  Database seeding failed or already seeded
```

**Cause**:

- MongoDB already contains data from previous run
- Connection issues

**Solution**:

```bash
# Option 1: Clear MongoDB data
docker volume ls | grep mongodb | awk '{print $2}' | xargs -r docker volume rm

# Option 2: Ignore the warning (it's benign if data exists)
# The seeding is idempotent - it checks if data exists first
```

---

### Issue 4: Container Network Errors

**Symptoms**:

```text
ContainerNetworkConnection errors in logs
Failed to configure dashboard resource
```

**Cause**:

- Stale networks from previous runs
- Network name conflicts

**Solution**:

```bash
# Clean up all Aspire networks
docker network ls | grep aspire | awk '{print $1}' | xargs -r docker network rm

# Clean up orphaned networks
docker network prune -f

# Restart
cd BookStore.Aspire.AppHost
./clean-start.sh
```

---

### Issue 5: Port Already in Use

**Symptoms**:

```text
Error: Address already in use
Cannot bind to port 7002/7004/15888
```

**Solution**:

```bash
# Find what's using the port
lsof -i :7002
lsof -i :15888

# Kill the process
kill -9 <PID>

# OR use clean-start.sh which handles this
./clean-start.sh
```

---

### Issue 6: OTLP Endpoint Errors

**Symptoms**:

```text
DOTNET_DASHBOARD_OTLP_ENDPOINT_URL environment variable not set
```

**Solution**:
Always use the clean-start script OR set environment variables:

```bash
ASPNETCORE_URLS="http://localhost:15888" \
DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL="http://localhost:18889" \
ASPIRE_ALLOW_UNSECURED_TRANSPORT=true \
dotnet run
```

---

## Resource Management

### Reduce Resource Usage

If you're experiencing performance issues:

1. **Disable API Simulator** (saves ~200MB RAM):

   ```json
   // appsettings.json
   { "ApiSimulatorEnabled": false }
   ```

2. **Run Without Grafana/Prometheus**:
   Comment out in `Program.cs`:

   ```csharp
   // var prometheus = builder.AddContainer("prometheus", ...
   // var grafana = builder.AddContainer("grafana", ...
   ```

3. **Limit Docker Resources**:

   ```bash
   # Docker Desktop → Settings → Resources
   # Set CPU: 4 cores, Memory: 8GB
   ```

### Check Resource Usage

```bash
# Container stats
docker stats

# System resources
docker system df

# Clean up unused resources
docker system prune -a --volumes -f
```

---

## Recommended Startup Sequence

### Option 1: Full Stack (All Services)

```bash
cd BookStore.Aspire.AppHost
./clean-start.sh
```

**Includes**:

- BookStore API (port 7002)
- Performance Service (port 7004)
- MongoDB, Redis
- Prometheus, Grafana
- API Simulator (port 28880)
- Aspire Dashboard (port 15888)

**Requirements**: 8GB+ RAM

---

### Option 2: Minimal (Without API Simulator)

```bash
# Edit appsettings.json first
# Set ApiSimulatorEnabled: false

cd BookStore.Aspire.AppHost
./clean-start.sh
```

**Includes**:

- BookStore API
- Performance Service
- MongoDB, Redis
- Prometheus, Grafana
- Aspire Dashboard

**Requirements**: 6GB+ RAM

---

### Option 3: Services Only (No Monitoring)

```bash
# Use startup scripts instead of Aspire
cd scripts/startup
./start-services.sh
```

**Includes**:

- BookStore API
- Performance Service
- MongoDB, Redis

**Requirements**: 4GB RAM

---

## Diagnostic Commands

### Check All Services

```bash
# Aspire Dashboard
curl -s http://localhost:15888/health || echo "Aspire not running"

# BookStore API
curl -s http://localhost:7002/health || echo "BookStore not running"

# API Simulator
curl -s http://localhost:28880/api/agent/settings || echo "Simulator not running"

# MongoDB
docker exec -it $(docker ps -q --filter "name=mongodb") mongosh --eval "db.adminCommand('ping')" || echo "MongoDB not running"
```

### View Logs

```bash
# Aspire/DCP logs
tail -f /tmp/aspire-*.log

# BookStore API logs
docker logs -f $(docker ps -q --filter "name=bookstore-service")

# API Simulator logs
docker logs -f $(docker ps -q --filter "name=api-simulator")

# All Aspire containers
for container in $(docker ps -q); do
  echo "=== $(docker inspect --format='{{.Name}}' $container) ==="
  docker logs --tail=20 $container
  echo ""
done
```

---

## Clean Slate Reset

When nothing else works:

```bash
#!/bin/bash
# Nuclear option - complete reset

echo "⚠️  This will remove ALL Docker containers and networks!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Stop everything
pkill -f dotnet
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker network prune -f
docker volume prune -f
docker system prune -a -f

echo "✅ Complete reset done. You can now start fresh."
```

---

## Getting Help

1. Check this guide first
2. Review logs: `docker logs <container-id>`
3. Check Aspire Dashboard: <http://localhost:15888>
4. GitHub Issues: Include logs and error messages
5. Check CLAUDE.md for project-specific commands

---

## Makefile Commands

```bash
# Quick commands (if using Makefile)
make reset              # Factory reset
make health-check       # Test all endpoints
make logs-bookstore     # View BookStore logs
make status             # Check service status
make docker-clean       # Clean Docker resources
```

---

## Prevention Tips

1. **Always use clean-start.sh** - Don't run `dotnet run` directly
2. **One instance at a time** - Don't start multiple Aspire instances
3. **Regular cleanup** - Run cleanup between sessions
4. **Monitor resources** - Use `docker stats` to watch usage
5. **Disable unused services** - Turn off API Simulator if not needed
