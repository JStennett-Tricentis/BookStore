# Migration Guide: AiHubPerfExample → hub-services-latest

## Purpose

This document outlines the migration of monitoring and observability infrastructure from the BookStore performance testing project to the hub-services-latest production project. The goal is to implement bare minimum monitoring to measure current load and track performance after payload size increases.

## Migration Phases

### Phase 1: Core Monitoring Infrastructure (Start Here)
- Prometheus metrics collection
- Grafana dashboards for system metrics (CPU, RAM, etc.)
- .NET Aspire integration for orchestration
- Basic OpenTelemetry instrumentation

### Phase 2: Advanced Features (Later)
- LLM token/cost tracking
- Custom performance dashboards
- K6 performance testing integration
- Advanced error tracking

---

## Phase 1: Bare Minimum Integration

### Overview

**What you're getting:**
- Prometheus metrics scraping (port 9090)
- Grafana dashboards (port 3000)
- System metrics: CPU, RAM, GC, thread pool, HTTP requests
- Aspire Dashboard orchestration (port 15888)
- OpenTelemetry instrumentation

**Why these components:**
- **Prometheus**: Collects and stores metrics from .NET applications
- **Grafana**: Visualizes metrics with pre-built dashboards
- **Aspire**: Orchestrates all services with health checks and logging
- **OpenTelemetry**: Standard instrumentation for .NET apps

---

## Files to Review and Copy

### 1. Monitoring Configuration Files

#### A. Prometheus Configuration
**Source:** `AiHubPerfExample/monitoring/prometheus/`

**Files to copy:**
```
monitoring/
├── prometheus/
│   ├── prometheus.yml           # Main Prometheus config
│   └── README.md                # Prometheus setup guide
```

**Key sections in `prometheus.yml`:**
```yaml
scrape_configs:
  - job_name: 'bookstore-api'
    static_configs:
      - targets: ['bookstore-api:8080']  # Change to your service name/port

  - job_name: 'performance-service'
    static_configs:
      - targets: ['performance-service:8080']  # Add your services here
```

**Action Required:**
- [ ] Copy `monitoring/prometheus/` directory
- [ ] Update `prometheus.yml` with hub-services endpoints
- [ ] Replace `bookstore-api` with your actual service names
- [ ] Update target ports to match your services

---

#### B. Grafana Dashboards
**Source:** `AiHubPerfExample/monitoring/grafana/`

**Files to copy for Phase 1 (System Metrics Only):**
```
monitoring/
├── grafana/
│   ├── dashboards/
│   │   ├── system-health.json              # CPU, RAM, process stats ⭐ START HERE
│   │   ├── dotnet-runtime.json             # GC, memory, exceptions
│   │   ├── http-kestrel.json               # HTTP server metrics
│   │   ├── threading-concurrency.json      # Thread pool, locks
│   │   └── README.md
│   ├── provisioning/
│   │   ├── dashboards/
│   │   │   └── default.yml
│   │   └── datasources/
│   │       └── prometheus.yml
│   └── grafana.ini                         # Grafana configuration
```

**⭐ Recommended Starting Dashboard:**
- **system-health.json** - CPU, RAM, uptime, process stats (most important for initial measurement)

**Optional dashboards (add later if needed):**
- `dotnet-runtime.json` - .NET-specific GC and memory metrics
- `http-kestrel.json` - HTTP request rates and latency

**Action Required:**
- [ ] Copy `monitoring/grafana/` directory
- [ ] Review `system-health.json` dashboard panels
- [ ] Update dashboard variables to match your service names
- [ ] Configure Grafana provisioning to auto-load dashboards

---

#### C. Docker Compose Configuration
**Source:** `AiHubPerfExample/docker-compose.perf.yml`

**Sections to extract:**
```yaml
# Prometheus service
prometheus:
  image: prom/prometheus:latest
  container_name: prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'

# Grafana service
grafana:
  image: grafana/grafana:latest
  container_name: grafana
  ports:
    - "3000:3000"
  environment:
    - GFG_SECURITY_ADMIN_PASSWORD=admin123
  volumes:
    - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:
```

**Action Required:**
- [ ] Add Prometheus and Grafana services to hub-services docker-compose
- [ ] Update volume paths to match hub-services structure
- [ ] Ensure ports don't conflict with existing services
- [ ] Add network configuration if using custom networks

---

### 2. .NET Code and Configuration

#### A. OpenTelemetry Instrumentation
**Source:** `AiHubPerfExample/BookStore.Common.Instrumentation/`

**Files to review:**
```
BookStore.Common.Instrumentation/
├── OpenTelemetryExtensions.cs           # Main OTel setup ⭐ CRITICAL
├── TracerProviderBuilderExtensions.cs   # Tracing config
└── BookStore.Common.Instrumentation.csproj
```

**Key method in `OpenTelemetryExtensions.cs`:**
```csharp
public static IServiceCollection AddBookStoreOpenTelemetry(
    this IServiceCollection services,
    IConfiguration configuration)
{
    services.AddOpenTelemetry()
        .ConfigureResource(resource => resource
            .AddService(serviceName: configuration["ServiceName"] ?? "unknown"))
        .WithMetrics(metrics => metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddProcessInstrumentation()
            .AddPrometheusExporter())
        .WithTracing(tracing => tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddMongoDBInstrumentation()
            .AddRedisInstrumentation());

    return services;
}
```

**Action Required:**
- [ ] Create similar instrumentation project or add to existing Common library
- [ ] Install NuGet packages (see section 3 below)
- [ ] Adapt to hub-services data stores (SQL Server vs MongoDB, etc.)
- [ ] Configure service names in appsettings.json

---

#### B. Service Integration (Program.cs)
**Source:** `AiHubPerfExample/BookStore.Service/Program.cs`

**Key sections to copy:**
```csharp
// 1. Add OpenTelemetry
builder.Services.AddBookStoreOpenTelemetry(builder.Configuration);

// 2. Expose Prometheus metrics endpoint
app.UseOpenTelemetryPrometheusScrapingEndpoint();

// 3. Health checks (optional but recommended)
builder.Services.AddHealthChecks()
    .AddSqlServer(connectionString)  // Adjust for your DB
    .AddRedis(redisConnectionString);

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");
```

**Action Required:**
- [ ] Add OpenTelemetry registration to each service's Program.cs
- [ ] Add Prometheus endpoint middleware
- [ ] Configure health checks for SQL Server, Redis, etc.
- [ ] Update appsettings.json with service names

---

#### C. Configuration Files (appsettings.json)
**Source:** `AiHubPerfExample/BookStore.Service/appsettings.json`

**Sections to add:**
```json
{
  "ServiceName": "hub-service-api",  // Change per service
  "OpenTelemetry": {
    "Enabled": true,
    "PrometheusPort": 8080,
    "JaegerEndpoint": "http://localhost:4317"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**Action Required:**
- [ ] Add ServiceName to each microservice
- [ ] Enable OpenTelemetry configuration
- [ ] Configure appropriate log levels

---

### 3. NuGet Packages Required

**Source:** `AiHubPerfExample/BookStore.Common.Instrumentation/BookStore.Common.Instrumentation.csproj`

**Essential packages for Phase 1:**
```xml
<ItemGroup>
  <!-- Core OpenTelemetry -->
  <PackageReference Include="OpenTelemetry" Version="1.9.0" />
  <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.9.0" />

  <!-- Metrics -->
  <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.9.0" />
  <PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.9.0" />
  <PackageReference Include="OpenTelemetry.Instrumentation.Runtime" Version="1.9.0" />
  <PackageReference Include="OpenTelemetry.Instrumentation.Process" Version="0.5.0-beta.6" />

  <!-- Exporters -->
  <PackageReference Include="OpenTelemetry.Exporter.Prometheus.AspNetCore" Version="1.9.0-beta.2" />
  <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.9.0" />
</ItemGroup>
```

**Optional packages (if using specific data stores):**
```xml
<!-- If using MongoDB -->
<PackageReference Include="OpenTelemetry.Instrumentation.MongoDB" Version="1.0.0-beta.1" />

<!-- If using Redis -->
<PackageReference Include="OpenTelemetry.Instrumentation.StackExchangeRedis" Version="1.0.0-rc9.14" />

<!-- If using Entity Framework -->
<PackageReference Include="OpenTelemetry.Instrumentation.EntityFrameworkCore" Version="1.0.0-beta.12" />

<!-- If using SQL Server -->
<PackageReference Include="OpenTelemetry.Instrumentation.SqlClient" Version="1.9.0-beta.1" />
```

**Action Required:**
- [ ] Install core OpenTelemetry packages
- [ ] Add instrumentation packages for your data stores
- [ ] Update to latest stable versions (check nuget.org)

---

### 4. .NET Aspire Integration

#### A. Aspire AppHost Project
**Source:** `AiHubPerfExample/BookStore.Aspire.AppHost/`

**Files to review:**
```
BookStore.Aspire.AppHost/
├── Program.cs                    # Main Aspire orchestration ⭐ KEY FILE
├── appsettings.json              # Aspire settings
├── Extensions/
│   └── ApiSimulatorExtensions.cs # You already have simulator, skip this
└── BookStore.Aspire.AppHost.csproj
```

**Key sections in `Program.cs`:**
```csharp
var builder = DistributedApplication.CreateBuilder(args);

// 1. Add infrastructure
var mongo = builder.AddMongoDB("mongo")
    .WithMongoExpress();

var redis = builder.AddRedis("redis");

// 2. Add Prometheus
var prometheus = builder.AddContainer("prometheus", "prom/prometheus")
    .WithBindMount("./monitoring/prometheus", "/etc/prometheus")
    .WithHttpEndpoint(port: 9090, targetPort: 9090, name: "prometheus-ui");

// 3. Add Grafana
var grafana = builder.AddContainer("grafana", "grafana/grafana")
    .WithBindMount("./monitoring/grafana/provisioning", "/etc/grafana/provisioning")
    .WithBindMount("./monitoring/grafana/dashboards", "/var/lib/grafana/dashboards")
    .WithHttpEndpoint(port: 3000, targetPort: 3000, name: "grafana-ui")
    .WithEnvironment("GF_SECURITY_ADMIN_PASSWORD", "admin123");

// 4. Add your services
var api = builder.AddProject<Projects.BookStore_Service>("bookstore-api")
    .WithReference(mongo)
    .WithReference(redis);

builder.Build().Run();
```

**Action Required:**
- [ ] Review existing Aspire setup in hub-services-latest
- [ ] Add Prometheus container to Aspire
- [ ] Add Grafana container to Aspire
- [ ] Ensure services reference monitoring infrastructure
- [ ] Configure Aspire to expose dashboard on port 15888

---

#### B. Aspire NuGet Packages
**Source:** `AiHubPerfExample/BookStore.Aspire.AppHost/BookStore.Aspire.AppHost.csproj`

```xml
<ItemGroup>
  <PackageReference Include="Aspire.Hosting.AppHost" Version="9.0.0" />
  <PackageReference Include="Aspire.Hosting.MongoDB" Version="9.0.0" />
  <PackageReference Include="Aspire.Hosting.Redis" Version="9.0.0" />
</ItemGroup>
```

**Note:** Requires .NET 9 SDK for Aspire AppHost project only. Services can remain .NET 8.

**Action Required:**
- [ ] Verify .NET 9 SDK installed (`dotnet --list-sdks`)
- [ ] Update Aspire packages to latest version
- [ ] Configure global.json if needed to specify SDK version

---

### 5. Makefile Commands (Optional but Recommended)

**Source:** `AiHubPerfExample/Makefile`

**Commands to copy for monitoring:**
```makefile
# Start services with Aspire
run-aspire:
	cd BookStore.Aspire.AppHost && dotnet run

# Open monitoring tools
grafana:
	open http://localhost:3000

prometheus:
	open http://localhost:9090

aspire-dashboard:
	open http://localhost:15888

# Health checks
health-check:
	@echo "Checking service health..."
	@curl -s http://localhost:7002/health | jq . || echo "❌ Service down"
```

**Action Required:**
- [ ] Add monitoring commands to hub-services Makefile
- [ ] Update ports to match hub-services configuration
- [ ] Test commands after integration

---

## Step-by-Step Integration Plan

### Step 1: Prerequisites (5 min)
```bash
# In hub-services-latest root:
# 1. Verify .NET SDKs
dotnet --list-sdks  # Need both 8.0.x and 9.0.x

# 2. Verify Docker running
docker ps

# 3. Create monitoring directory structure
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/{provisioning/dashboards,provisioning/datasources,dashboards}
```

### Step 2: Copy Configuration Files (10 min)
```bash
# From AiHubPerfExample to hub-services-latest:

# 1. Copy Prometheus config
cp AiHubPerfExample/monitoring/prometheus/prometheus.yml \
   hub-services-latest/monitoring/prometheus/

# 2. Copy Grafana dashboards
cp AiHubPerfExample/monitoring/grafana/dashboards/system-health.json \
   hub-services-latest/monitoring/grafana/dashboards/

cp -r AiHubPerfExample/monitoring/grafana/provisioning/* \
      hub-services-latest/monitoring/grafana/provisioning/

# 3. Copy Grafana config
cp AiHubPerfExample/monitoring/grafana/grafana.ini \
   hub-services-latest/monitoring/grafana/
```

### Step 3: Update Configuration (15 min)
```bash
# 1. Edit prometheus.yml
# Update scrape targets to match hub-services service names and ports

# 2. Edit Grafana dashboard variables
# Open system-health.json
# Find "templating" section
# Update service names from "bookstore-api" to your actual services

# 3. Edit docker-compose or Aspire Program.cs
# Add Prometheus and Grafana container definitions
```

### Step 4: Add NuGet Packages (10 min)
```bash
# In each service project:
cd Tricentis.AI.Hub.Service  # or your main service

dotnet add package OpenTelemetry
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
dotnet add package OpenTelemetry.Instrumentation.Runtime
dotnet add package OpenTelemetry.Exporter.Prometheus.AspNetCore

# Add database-specific packages if needed
dotnet add package OpenTelemetry.Instrumentation.SqlClient  # if using SQL Server
```

### Step 5: Add OpenTelemetry Code (20 min)
```csharp
// In Program.cs of each service:

// 1. Add using statements
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;

// 2. Add before builder.Build()
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName: "hub-service-api"))  // Change per service
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddProcessInstrumentation()
        .AddPrometheusExporter());

// 3. Add after var app = builder.Build();
app.UseOpenTelemetryPrometheusScrapingEndpoint();
```

### Step 6: Update Aspire AppHost (15 min)
```csharp
// In hub-services Aspire AppHost Program.cs:

// Add Prometheus
var prometheus = builder.AddContainer("prometheus", "prom/prometheus")
    .WithBindMount("../monitoring/prometheus", "/etc/prometheus")
    .WithHttpEndpoint(port: 9090, targetPort: 9090, name: "prometheus-ui");

// Add Grafana
var grafana = builder.AddContainer("grafana", "grafana/grafana")
    .WithBindMount("../monitoring/grafana/provisioning", "/etc/grafana/provisioning")
    .WithBindMount("../monitoring/grafana/dashboards", "/var/lib/grafana/dashboards")
    .WithHttpEndpoint(port: 3000, targetPort: 3000, name: "grafana-ui")
    .WithEnvironment("GF_SECURITY_ADMIN_PASSWORD", "admin123");
```

### Step 7: Test the Integration (10 min)
```bash
# 1. Build solution
dotnet build

# 2. Start with Aspire
cd AppHost && dotnet run

# 3. Verify services started
curl http://localhost:15888  # Aspire Dashboard
curl http://localhost:9090   # Prometheus
curl http://localhost:3000   # Grafana (admin/admin123)

# 4. Check metrics endpoint
curl http://localhost:YOUR_SERVICE_PORT/metrics

# 5. Open Grafana dashboard
# Login: admin/admin123
# Navigate to Dashboards → System Health
```

### Step 8: Baseline Measurement (15 min)
```bash
# 1. Run services for 5 minutes under normal load
# 2. Open Grafana System Health dashboard
# 3. Take screenshots or note down baseline metrics:
#    - CPU usage: ____%
#    - RAM usage: ____ MB
#    - Request rate: ____ req/s
#    - Response time: ____ ms
# 4. Document in a BASELINE_METRICS.md file
```

---

## Dashboard Panel Mapping

### System Health Dashboard (system-health.json)

**CPU Metrics:**
- `process_cpu_usage` - Process CPU utilization (%)
- `process_cpu_seconds_total` - Total CPU time consumed

**Memory Metrics:**
- `process_working_set_bytes` - RAM usage by process
- `process_private_memory_bytes` - Private memory bytes
- `dotnet_total_memory_bytes` - .NET managed memory

**Process Metrics:**
- `process_uptime_seconds` - Service uptime
- `process_num_threads` - Active thread count

**HTTP Metrics:**
- `http_server_request_duration_seconds` - Request latency
- `http_server_active_requests` - Concurrent requests

**Prometheus Queries to Understand:**
```promql
# CPU usage percentage
rate(process_cpu_seconds_total[1m]) * 100

# Memory usage in MB
process_working_set_bytes / 1024 / 1024

# Request rate (requests per second)
rate(http_server_request_duration_seconds_count[1m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket[5m]))
```

---

## Verification Checklist

After integration, verify:

- [ ] Prometheus scraping metrics from all services
  - Visit http://localhost:9090/targets
  - All targets should show "UP" status

- [ ] Grafana dashboards loading data
  - Login to http://localhost:3000 (admin/admin123)
  - Open System Health dashboard
  - Verify all panels showing data (not "No Data")

- [ ] Metrics endpoint responding
  - `curl http://localhost:YOUR_PORT/metrics`
  - Should return Prometheus-format metrics

- [ ] Aspire Dashboard showing services
  - Visit http://localhost:15888
  - All services, Prometheus, Grafana should be green

- [ ] Health checks working
  - `curl http://localhost:YOUR_PORT/health`
  - Should return HTTP 200 with status

---

## Common Issues and Solutions

### Issue 1: Prometheus shows "DOWN" targets
**Symptoms:** Targets page shows services as unreachable

**Solutions:**
- Check service ports in `prometheus.yml` match actual ports
- Verify services expose `/metrics` endpoint
- Check Docker networking (services in same network)
- Ensure `UseOpenTelemetryPrometheusScrapingEndpoint()` called

### Issue 2: Grafana dashboards show "No Data"
**Symptoms:** Dashboard panels are empty

**Solutions:**
- Verify Prometheus datasource configured correctly
  - Grafana → Configuration → Data Sources → Prometheus
  - URL should be `http://prometheus:9090` (Docker) or `http://localhost:9090` (local)
- Check Prometheus has scraped data (visit /targets)
- Update dashboard variables to match your service names
- Wait 1-2 minutes for initial data collection

### Issue 3: Missing metrics in Prometheus
**Symptoms:** Some metrics not appearing in Prometheus

**Solutions:**
- Verify NuGet packages installed for specific instrumentation
- Check `AddMetrics()` includes necessary instrumentation
- Ensure services generating traffic (metrics appear on activity)
- Check Prometheus scrape interval (default 15s)

### Issue 4: .NET Aspire won't start
**Symptoms:** Aspire AppHost crashes on startup

**Solutions:**
- Verify .NET 9 SDK installed: `dotnet --list-sdks`
- Check bind mount paths are correct (relative to AppHost project)
- Ensure monitoring directories exist
- Check Docker Desktop running
- Review Aspire logs in terminal

### Issue 5: Port conflicts
**Symptoms:** "Port already in use" errors

**Solutions:**
- Check what's using the port: `lsof -i :9090`
- Update port mappings in Aspire/docker-compose
- Update Grafana datasource URL if Prometheus port changed
- Kill conflicting processes or use different ports

---

## Performance Measurement Strategy

### Before Payload Increase (Baseline)
1. Run system under normal load for 15-30 minutes
2. Record metrics:
   - Average CPU: ____%
   - Peak CPU: ____%
   - Average RAM: ____ MB
   - Peak RAM: ____ MB
   - Average request latency: ____ ms
   - P95 latency: ____ ms
   - Request rate: ____ req/s
   - Error rate: ____%

### After Payload Increase
1. Increase payload size
2. Run system under same load conditions
3. Record same metrics
4. Calculate differences:
   - CPU increase: ____% → ____% (+____%)
   - RAM increase: ____ MB → ____ MB (+____ MB)
   - Latency impact: ____ ms → ____ ms (+____ ms)

### Grafana Dashboard Time Ranges
- Use "Last 5 minutes" for real-time monitoring
- Use "Last 1 hour" for trend analysis
- Use "Last 24 hours" for daily patterns
- Use "Custom range" to compare before/after periods

---

## Reference Files in AiHubPerfExample

### Essential References
1. **OpenTelemetry Setup:**
   - `BookStore.Common.Instrumentation/OpenTelemetryExtensions.cs`
   - Shows complete metrics configuration

2. **Service Integration:**
   - `BookStore.Service/Program.cs:44-63`
   - Complete example of OTel in Program.cs

3. **Aspire Orchestration:**
   - `BookStore.Aspire.AppHost/Program.cs`
   - Full Aspire setup with Prometheus/Grafana

4. **Prometheus Config:**
   - `monitoring/prometheus/prometheus.yml`
   - Scrape configuration and targets

5. **Grafana Dashboard:**
   - `monitoring/grafana/dashboards/system-health.json`
   - Best starting dashboard for system metrics

6. **Documentation:**
   - `docs/GRAFANA_DASHBOARDS.md`
   - Dashboard descriptions and query explanations
   - `CLAUDE.md`
   - Project overview and commands

### Optional References (Phase 2)
7. **LLM Metrics:**
   - `BookStore.Service/Services/LLMServiceBase.cs:95-120`
   - Token tracking implementation
   - `monitoring/grafana/dashboards/bookstore-llm-metrics.json`
   - LLM-specific dashboard

8. **K6 Testing:**
   - `BookStore.Performance.Tests/scenarios/load-test.js`
   - Performance test examples

9. **Advanced Dashboards:**
   - `monitoring/grafana/dashboards/*.json`
   - All 10 specialized dashboards

---

## Quick Start Commands

```bash
# In new Claude Code session in hub-services-latest:

# 1. Copy this migration guide
cat /Users/j.stennett/TAIS/AiHubPerfExample/docs/MIGRATION_TO_HUB_SERVICES.md

# 2. Create monitoring structure
mkdir -p monitoring/{prometheus,grafana/{provisioning/{dashboards,datasources},dashboards}}

# 3. Copy essential files
cp /Users/j.stennett/TAIS/AiHubPerfExample/monitoring/prometheus/prometheus.yml \
   monitoring/prometheus/

cp /Users/j.stennett/TAIS/AiHubPerfExample/monitoring/grafana/dashboards/system-health.json \
   monitoring/grafana/dashboards/

# 4. Review reference files
cat /Users/j.stennett/TAIS/AiHubPerfExample/BookStore.Common.Instrumentation/OpenTelemetryExtensions.cs
cat /Users/j.stennett/TAIS/AiHubPerfExample/BookStore.Service/Program.cs
cat /Users/j.stennett/TAIS/AiHubPerfExample/BookStore.Aspire.AppHost/Program.cs
```

---

## Success Criteria

Phase 1 is complete when:

✅ Prometheus collecting metrics from all hub-services
✅ Grafana System Health dashboard showing real data
✅ Aspire Dashboard showing all services healthy
✅ Baseline metrics documented
✅ Team can view CPU, RAM, request metrics in real-time
✅ `/metrics` endpoint available on all services
✅ `/health` endpoints returning 200 OK

---

## Next Session Commands

```bash
# Start the new session with:
cd /Users/j.stennett/TAIS/hub-services-latest

# Point Claude to this guide:
cat /Users/j.stennett/TAIS/AiHubPerfExample/docs/MIGRATION_TO_HUB_SERVICES.md

# Reference the AiHubPerfExample project:
# "Review the monitoring setup in /Users/j.stennett/TAIS/AiHubPerfExample
#  and help me integrate it following the MIGRATION_TO_HUB_SERVICES.md guide"
```

---

## Estimated Time

- **Phase 1 Integration:** 1.5 - 2 hours
- **Testing and Verification:** 30 minutes
- **Baseline Measurement:** 15-30 minutes
- **Total:** ~2.5 - 3 hours

---

## Support Resources

- **OpenTelemetry .NET Docs:** https://opentelemetry.io/docs/languages/net/
- **Prometheus Query Docs:** https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Grafana Dashboard Docs:** https://grafana.com/docs/grafana/latest/dashboards/
- **.NET Aspire Docs:** https://learn.microsoft.com/en-us/dotnet/aspire/

---

**Document Version:** 1.0
**Created:** 2025-10-08
**Project:** AiHubPerfExample → hub-services-latest Migration
**Purpose:** Phase 1 monitoring integration for payload size impact measurement
