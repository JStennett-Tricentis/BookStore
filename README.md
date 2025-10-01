# BookStore Performance Testing POC

Enterprise-grade .NET 8 performance testing application demonstrating production-ready monitoring, CI/CD, and multi-LLM support.

## Quick Start

```bash
# Setup and start (auto-cleans MongoDB, starts all services)
make run-aspire

# Run smoke test
make perf-smoke

# Generate HTML report
make perf-report
```

**Access:**

- API: <http://localhost:7002/swagger>
- Aspire Dashboard: <http://localhost:15888>
- Grafana: <http://localhost:3000> (admin/admin123)
- Prometheus: <http://localhost:9090>

## Architecture

### Services

- **BookStore.Service** - REST API with CRUD + AI summaries
- **BookStore.Performance.Service** - K6 test orchestration
- **BookStore.Aspire.AppHost** - .NET Aspire orchestration

### Infrastructure

- **MongoDB** - Primary database
- **Redis** - Distributed caching
- **Ollama** - Free local LLM (default, $0 cost)
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards & visualization
- **K6** - Load testing

### Observability Stack

- **OpenTelemetry** - Traces, metrics, logs
- **TraceLoop** - LLM-specific observability
- **Semantic Conventions** - Standard gen_ai.*, llm.* tags
- **Real-time Cost Tracking** - Token usage & API costs

## LLM Support (Multi-Provider)

### Providers

1. **Ollama** (default) - Free unlimited local models
   - llama3.2, mistral, phi3, etc.
   - Zero cost for performance testing
   - Full OpenTelemetry instrumentation

2. **Claude** - Anthropic direct API
   - claude-3-5-sonnet-20241022
   - $3/M input, $15/M output tokens

3. **OpenAI** - GPT models (SDK ready)
   - gpt-4o, gpt-4.1-mini

4. **Bedrock** - AWS-hosted models (SDK ready)
   - us.anthropic.claude-sonnet-4-*

### Switch Provider

Edit `appsettings.json`:

```json
{
  "LLM": {
    "Provider": "Ollama"  // or "Claude", "OpenAI", "Bedrock"
  }
}
```

## Performance Testing

### K6 Scenarios

```bash
make perf-smoke         # 1-2 users, 2 min
make perf-load          # 10 users, 10 min
make perf-stress        # 30 users, 15 min
make perf-spike         # Burst to 50 users
make perf-ai-smoke      # LLM endpoint test
make perf-errors        # Error handling validation
make perf-comprehensive # All tests (~30 min)
```

### Test Features

- Multiple user profiles (reader, librarian, manager)
- Mixed workloads (CRUD + AI operations)
- Error scenario testing
- HTML reports with percentiles
- Real-time Grafana dashboards

## CI/CD (GitHub Actions)

### Workflows

- **pr.yaml** - Build, test, lint, Docker, K6, security scan
- **deploy.yaml** - Multi-env deployment (dev/staging/prod)
- **performance.yaml** - Daily scheduled performance tests
- **codeql.yaml** - Security scanning (C# + JS)
- **dependabot.yml** - Automated dependency updates

### Features

- Docker image publishing to GHCR
- Code coverage with Codecov
- Trivy security scanning
- Parallel job execution
- Environment-specific approvals

## Monitoring

### Grafana Dashboards

1. **bookstore-performance.json**
   - LLM Requests/sec, P95 latency, error rate
   - Token usage (input/output/total)
   - API cost tracking ($)
   - LLM vs non-LLM traffic

2. **bookstore-system-health.json**
   - CPU, memory, threads
   - GC collections, HTTP metrics
   - Kestrel connection pool

### Prometheus Metrics

- 36+ metric types (runtime, HTTP, custom)
- Token counters: `claude.tokens.*`, `ollama.tokens.*`
- Cost histogram: `claude.cost.usd`, `ollama.cost.usd`
- HTTP duration: `http_server_request_duration_seconds`

### Example Results

- **540 LLM requests = $0.99** (Claude)
- **Unlimited requests = $0** (Ollama)
- P95 latency: 8s (LLM), 50ms (CRUD)

## Development

### Prerequisites

- .NET 8 SDK
- Docker Desktop
- K6 (`brew install k6`)

### Commands

```bash
make help               # Show all 40+ commands
make dev-setup          # Install dependencies
make build              # Build solution
make test               # Run tests
make format             # Format code
make status             # Check service health
make logs-bookstore     # View logs
make docker-clean       # Reset everything
```

### MongoDB Fix

MongoDB volumes auto-clean on startup via `start-aspire.sh` to prevent auth issues.

## Project Structure

```yaml
├── BookStore.Service/                # Main API
│   ├── Controllers/                  # REST endpoints
│   ├── Services/                     # Business logic + LLM services
│   └── appsettings.json              # Configuration
├── BookStore.Common/                 # Shared models
├── BookStore.Common.Instrumentation/ # OpenTelemetry setup
├── BookStore.Performance.Tests/      # K6 tests
│   ├── tests/                        # Test scenarios
│   ├── scenarios/                    # Load patterns
│   ├── utils/                        # Helpers
│   └── generate-html-report.js       # Report generator
├── BookStore.Aspire.AppHost/         # Aspire orchestration
├── monitoring/
│   ├── grafana/dashboards/           # 2 dashboards
│   └── prometheus/prometheus.yml     # Scrape config
├── .github/workflows/                # CI/CD (5 workflows)
├── Makefile                          # 40+ automation commands
├── MONITORING_COMPARISON.md          # vs hub-services-latest
└── docker-compose.perf.yml           # Full stack + Ollama
```

## Key Features vs hub-services-latest

### Better

- ✅ Prometheus + Grafana (vs expensive Coralogix)
- ✅ Local monitoring stack
- ✅ K6 performance testing
- ✅ HTML test reports
- ✅ Ollama for free testing
- ✅ Cost tracking dashboards
- ✅ GitHub Actions CI/CD

### Same

- ✅ OpenTelemetry semantic conventions
- ✅ TraceLoop integration
- ✅ Health checks
- ✅ Multi-provider LLM support

### Cost Savings

**$200-500/month** - Open-source stack vs Coralogix subscription

## Documentation

- **CLAUDE.md** - Project instructions for AI assistants
- **MONITORING_COMPARISON.md** - Detailed comparison with hub-services-latest
- **LLM_TESTING.md** - LLM performance testing guide
- **Makefile help** - `make help` for all commands

## Troubleshooting

### MongoDB Auth Issues

```bash
# Auto-fixed by start-aspire.sh
make run-aspire  # Cleans volumes automatically
```

### Services Not Starting

```bash
make status       # Check what's running
make health-check # Test endpoints
make logs-bookstore  # View logs
make restart      # Stop and restart
```

### Port Conflicts

```bash
lsof -Pi :7002   # Check API port
lsof -Pi :11434  # Check Ollama port
```

## License

Enterprise POC for performance testing research.
