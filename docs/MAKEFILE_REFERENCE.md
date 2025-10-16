# Makefile Quick Reference

## 🚀 Quick Start Commands

```bash
make run-aspire          # Start everything with Aspire (RECOMMENDED)
make perf-workspace      # Open Dashboard + Grafana + Aspire in browser
make perf-ai-smoke       # Quick AI test (uses current provider from appsettings.json)
```

---

## 📦 Service Management

### Starting Services

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `make run-aspire` | **RECOMMENDED**: Start all services with Aspire Dashboard | Default method for development |
| `make run-services` | Start services with shell scripts (no Aspire) | When Aspire has issues |
| `make run-bookstore` | Run BookStore API only | Testing API in isolation |
| `make run-performance` | Run Performance service only | Testing K6 orchestration |

### Stopping Services

| Command | What It Does |
|---------|-------------|
| `make stop-services` | Stop all Docker containers and processes |
| `make clean` | Stop services and clean all artifacts |
| `make reset` | Factory reset (nuclear option) |

---

## 🎯 Performance Testing

### Quick Tests (< 5 minutes)

| Command | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| `make perf-smoke` | 1 | 2 min | Basic functionality check |
| `make perf-ai-smoke` | 1-2 | 3 min | AI endpoint quick test |

### Standard Tests (10-20 minutes)

| Command | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| `make perf-load` | 10 | 10 min | Standard load test |
| `make perf-ai-load` | 3-5 | 12 min | AI-focused load test |
| `make perf-stress` | 30 | 15 min | Stress testing |
| `make perf-ai-stress` | 5-15 | 17 min | AI stress testing |

### Advanced Tests

| Command | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| `make perf-spike` | 1→50 | 5 min | Burst traffic handling |
| `make perf-chaos` | Random | 4 min | Random spikes + errors + LLM |
| `make perf-extreme` | 500+ | 6 min | 🔥 WILL BREAK SYSTEM |
| `make perf-mixed` | 10 | 15 min | 20% AI + 80% CRUD |
| `make perf-mixed-heavy` | 10 | 15 min | 50% AI + 50% CRUD |

### Test Suites

| Command | Duration | What It Runs |
|---------|----------|--------------|
| `make perf-comprehensive` | ~30 min | ALL non-AI tests |
| `make perf-ai-all` | ~40 min | ALL AI tests |
| `make test-all` | ~5 min | Integration + smoke tests |

---

## 📊 Monitoring & Dashboards

### Quick Access

| Command | Opens |
|---------|-------|
| `make grafana` | Grafana (admin/admin123) |
| `make grafana-mega` | MEGA dashboard (all 91 widgets) |
| `make grafana-demo` | Demo dashboard (53 curated panels) |
| `make grafana-dashboards` | All 8 specialized dashboards |
| `make prometheus` | Prometheus UI |
| `make aspire-dashboard` | Aspire Dashboard |
| `make swagger` | Swagger API docs |
| `make perf-dashboard` | K6 Web UI Dashboard |

### Workspace Launchers

| Command | Opens |
|---------|-------|
| `make perf-workspace` | Dashboard + Grafana + Aspire (3 tabs) |
| `make monitoring-workspace` | Grafana + Prometheus (2 tabs) |

---

## 🧪 Testing

### .NET Tests

| Command | Purpose |
|---------|---------|
| `make test-integration` | Run .NET integration tests |
| `make test-watch` | Run tests in watch mode |
| `make test-smoke` | Run Postman/Newman smoke tests |
| `make test-all` | Run integration + smoke tests |

### Benchmark Tests (BenchmarkDotNet)

| Command | Purpose |
|---------|---------|
| `make bench` | Run all micro-benchmarks |
| `make bench-json` | JSON serialization benchmarks only |
| `make bench-string` | String manipulation benchmarks only |
| `make bench-memory` | Run with memory profiler |
| `make bench-report` | Open HTML reports |
| `make bench-clean` | Clean benchmark artifacts |

---

## 🔧 Troubleshooting & Maintenance

### Health Checks

| Command | Purpose |
|---------|---------|
| `make health-check` | Test all service endpoints |
| `make status` | Show service status |
| `make logs-bookstore` | View BookStore API logs |
| `make logs-performance` | View Performance service logs |

### Cleanup

| Command | What It Cleans |
|---------|---------------|
| `make clean` | Stop services, remove logs |
| `make docker-clean` | Clean ALL Docker resources |
| `make perf-clean` | Remove old K6 test results |
| `make bench-clean` | Remove benchmark artifacts |
| `make reset` | NUCLEAR: Clean everything |

### Docker Management

| Command | Purpose |
|---------|---------|
| `make docker-up` | Start Docker Compose stack |
| `make docker-down` | Stop Docker Compose stack |
| `make docker-logs` | View Docker container logs |
| `make docker-clean` | Clean Docker volumes/networks |

---

## 🧠 LLM Provider Testing

**See [LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md) for complete details**

### Configuration
1. Edit `BookStore.Service/appsettings.json`
2. Set `LLM.Provider` to: `"Ollama"`, `"LMStudio"`, `"Claude"`, `"OpenAI"`, or `"Bedrock"`
3. Run: `make run-aspire`

### Testing Current Provider
```bash
make perf-ai-smoke    # Quick test
make perf-ai-load     # Load test
make perf-ai-stress   # Stress test
make perf-mixed       # Mixed CRUD + AI
```

### Testing Specific Provider (No Restart)
```bash
# Via curl with provider parameter
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=ollama
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=lmstudio
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=claude
```

---

## 📝 Reporting & Results

### Performance Reports

| Command | Purpose |
|---------|---------|
| `make perf-results` | View latest test results |
| `make perf-report` | Generate HTML report from latest |
| `make perf-report-all` | Generate reports for all results |
| `make perf-report-latest` | Generate and open latest report |

### Benchmark Reports

| Command | Purpose |
|---------|---------|
| `make bench-report` | Open benchmark HTML reports |
| `make bench-results` | List all benchmark result files |

---

## 🎨 API Simulator (Zero-Cost LLM Testing)

**Note: Disabled by default to avoid Docker auth issues**

| Command | Purpose |
|---------|---------|
| `make simulator-start` | Start API Simulator |
| `make simulator-stop` | Stop API Simulator |
| `make simulator-ui` | Open simulator UI (port 28880) |
| `make simulator-logs` | View simulator logs |
| `make simulator-verify` | Verify Docker image access |

To enable: Edit `BookStore.Aspire.AppHost/appsettings.json`, set `ApiSimulatorEnabled: true`

---

## 📖 Documentation

| Command | Purpose |
|---------|---------|
| `make help` | Show all available commands |
| `make bench-help` | Show benchmark detailed usage |

---

## 🔥 Common Workflows

### First Time Setup
```bash
make run-aspire              # Start all services
make perf-workspace          # Open dashboards
make perf-ai-smoke           # Run quick test
```

### Development Workflow
```bash
make run-aspire              # Start services
make swagger                 # Test API manually
make test-integration        # Run .NET tests
make perf-load               # Run load test
make grafana-mega            # View metrics
```

### Performance Testing Session
```bash
make perf-workspace          # Open workspace (3 tabs)
# Tab 1: Performance Dashboard - trigger tests
# Tab 2: Grafana - watch metrics live
# Tab 3: Aspire - monitor service health
```

### Switching LLM Providers
```bash
# Edit BookStore.Service/appsettings.json
# Change: "Provider": "Ollama" → "Provider": "LMStudio"
make restart                 # Restart services
make perf-ai-smoke           # Test new provider
make grafana-mega            # Compare metrics
```

### Troubleshooting Workflow
```bash
make health-check            # Check endpoints
make status                  # Check service status
make logs-bookstore          # View logs
make restart                 # Try restart
make reset                   # Nuclear option
```

---

## 💡 Tips

1. **Fastest Test**: `make perf-smoke` (2 min)
2. **Best for Demos**: `make perf-chaos` (4 min, shows all metrics)
3. **Zero-Cost AI Testing**: Use Ollama (`ollama pull gemma3:1b`) or LM Studio
4. **Live Metrics**: Keep Grafana open while running tests
5. **Quick Provider Test**: Use `?provider=name` URL parameter (no restart)
6. **Comprehensive View**: `make grafana-mega` shows all 91 metrics
7. **Web UI Testing**: `make perf-dashboard` for point-and-click test execution

---

## 🆘 When Things Break

```bash
# Quick restart
make restart

# Clean restart
make stop-services
make clean
make run-aspire

# Nuclear option (if all else fails)
make reset
make docker-clean
make run-aspire
```

---

## 📚 Additional Resources

- **LLM Setup**: [docs/LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)
- **Migration Guide**: [docs/MIGRATION_TO_HUB_SERVICES.md](MIGRATION_TO_HUB_SERVICES.md)
- **CLAUDE.md**: Complete project documentation
- **Performance Dashboard**: [BookStore.Performance.Service/wwwroot/README.md](../BookStore.Performance.Service/wwwroot/README.md)
