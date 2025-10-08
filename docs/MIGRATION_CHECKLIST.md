# Migration Checklist: Phase 1 Monitoring

Quick reference checklist for migrating monitoring infrastructure to hub-services-latest.

## Pre-Migration

- [ ] .NET 8 SDK installed and verified
- [ ] .NET 9 SDK installed and verified (for Aspire)
- [ ] Docker Desktop running
- [ ] hub-services-latest project accessible
- [ ] AiHubPerfExample project accessible

## Directory Structure

```bash
# Create in hub-services-latest root:
- [ ] mkdir -p monitoring/prometheus
- [ ] mkdir -p monitoring/grafana/provisioning/dashboards
- [ ] mkdir -p monitoring/grafana/provisioning/datasources
- [ ] mkdir -p monitoring/grafana/dashboards
```

## Copy Files

### Prometheus 1

- [ ] Copy `monitoring/prometheus/prometheus.yml`
- [ ] Update service names and ports in prometheus.yml

### Grafana 1

- [ ] Copy `monitoring/grafana/dashboards/system-health.json`
- [ ] Copy `monitoring/grafana/provisioning/` directory
- [ ] Copy `monitoring/grafana/grafana.ini`
- [ ] Update dashboard variables (service names)

## NuGet Packages (Each Service)

Core packages:

- [ ] `OpenTelemetry`
- [ ] `OpenTelemetry.Extensions.Hosting`
- [ ] `OpenTelemetry.Instrumentation.AspNetCore`
- [ ] `OpenTelemetry.Instrumentation.Http`
- [ ] `OpenTelemetry.Instrumentation.Runtime`
- [ ] `OpenTelemetry.Exporter.Prometheus.AspNetCore`

Database-specific:

- [ ] `OpenTelemetry.Instrumentation.SqlClient` (if using SQL Server)
- [ ] `OpenTelemetry.Instrumentation.EntityFrameworkCore` (if using EF)

## Code Changes (Each Service)

### Program.cs

- [ ] Add using statements for OpenTelemetry
- [ ] Add `AddOpenTelemetry()` configuration before `builder.Build()`
- [ ] Add `UseOpenTelemetryPrometheusScrapingEndpoint()` after `app = builder.Build()`
- [ ] Add health checks configuration
- [ ] Add `/health` endpoint mapping

### appsettings.json

- [ ] Add `ServiceName` setting
- [ ] Add `OpenTelemetry` configuration section
- [ ] Configure appropriate log levels

## Aspire AppHost Changes

- [ ] Add Prometheus container definition
- [ ] Add Grafana container definition
- [ ] Configure bind mounts for Prometheus config
- [ ] Configure bind mounts for Grafana dashboards
- [ ] Set Grafana admin password environment variable
- [ ] Ensure services reference monitoring containers (if needed)

## Testing

### Service Startup

- [ ] `dotnet build` succeeds
- [ ] Services start without errors
- [ ] Aspire Dashboard accessible (port 15888)

### Metrics Endpoint

- [ ] `curl http://localhost:PORT/metrics` returns data
- [ ] Metrics include `process_`, `dotnet_`, `http_` prefixes

### Prometheus 2

- [ ] Prometheus UI accessible (port 9090)
- [ ] Navigate to Status → Targets
- [ ] All services showing "UP" status
- [ ] Metrics visible in Prometheus query browser

### Grafana 2

- [ ] Grafana UI accessible (port 3000)
- [ ] Login with admin/admin123
- [ ] System Health dashboard exists
- [ ] Dashboard panels show data (not "No Data")
- [ ] CPU panel shows percentage
- [ ] RAM panel shows MB values
- [ ] HTTP request panel shows data

### Health Checks

- [ ] `curl http://localhost:PORT/health` returns 200 OK
- [ ] Health endpoint shows healthy status

## Baseline Metrics

Document baseline under normal load:

- [ ] CPU usage average: **\_**%
- [ ] CPU usage peak: **\_**%
- [ ] RAM usage average: **\_** MB
- [ ] RAM usage peak: **\_** MB
- [ ] Request latency average: **\_** ms
- [ ] Request latency P95: **\_** ms
- [ ] Request rate: **\_** req/s
- [ ] Error rate: **\_**%
- [ ] Screenshots saved to `docs/baseline/`

## Documentation

- [ ] BASELINE_METRICS.md created with measurements
- [ ] Team notified of Grafana credentials
- [ ] Dashboard URLs documented
- [ ] Common commands added to Makefile/README

## Success Criteria

- [ ] ✅ Prometheus scraping all services
- [ ] ✅ Grafana showing real-time data
- [ ] ✅ Aspire Dashboard green for all services
- [ ] ✅ Baseline metrics documented
- [ ] ✅ Team can access monitoring dashboards
- [ ] ✅ `/metrics` endpoints responding
- [ ] ✅ `/health` endpoints healthy

## Rollback Plan (If Needed)

- [ ] Remove OpenTelemetry NuGet packages
- [ ] Revert Program.cs changes
- [ ] Remove monitoring directory
- [ ] Remove Prometheus/Grafana from Aspire/Docker Compose

## Time Tracking

- Setup: **\_** minutes
- Code changes: **\_** minutes
- Testing: **\_** minutes
- Baseline measurement: **\_** minutes
- Total: **\_** minutes

## Notes

```text
[Space for troubleshooting notes, issues encountered, solutions found]
```

---

**Reference:** See MIGRATION_TO_HUB_SERVICES.md for detailed instructions
