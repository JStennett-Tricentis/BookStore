# Setup Guide

Quick setup instructions for configuring the BookStore Performance Testing POC on a new machine.

## Prerequisites

- .NET 8 SDK
- Docker Desktop
- K6 (`brew install k6` on macOS)
- Git

## Initial Setup

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd AiHubPerfExample
    ```

2. **Configure Application Settings**

    Copy the example configuration files and update with your API keys:

    ```bash
    # BookStore Service
    cp BookStore.Service/appsettings.example.json BookStore.Service/appsettings.json

    # Performance Service
    cp BookStore.Performance.Service/appsettings.example.json BookStore.Performance.Service/appsettings.json
    ```

3. **Update Configuration Files**

    Edit the `appsettings.json` files and replace placeholders:

    **BookStore.Service/appsettings.json:**
    - `LLM.Providers.Claude.ApiKey` - Your Claude API key (if using Claude)
    - `LLM.Providers.OpenAI.ApiKey` - Your OpenAI API key (if using OpenAI)
    - `Telemetry.TraceLoop.ApiKey` - Your TraceLoop API key (optional, or set `Enabled: false`)

    **BookStore.Performance.Service/appsettings.json:**
    - `Claude.ApiKey` - Your Claude API key
    - `Telemetry.TraceLoop.ApiKey` - Your TraceLoop API key (optional, or set `Enabled: false`)

    **Note:** If you only want to use Ollama (free, local LLM), you can leave the API keys as placeholders and set:

    ```json
    "LLM": {
      "Provider": "Ollama"
    }
    ```

4. **Install Dependencies**

    ```bash
    make dev-setup
    ```

5. **Build the Solution**
    ```bash
    make build
    ```

## Running the Application

### Option 1: .NET Aspire (Recommended)

Start all services with Aspire orchestration:

```bash
make run-aspire
```

This starts:

- BookStore API (port 7002)
- Performance Service (port 7004)
- MongoDB
- Redis
- Prometheus (port 9090)
- Grafana (port 3000, credentials: admin/admin123)
- Aspire Dashboard (port 15888)

### Option 2: Startup Scripts

If Aspire has issues, use the startup scripts:

```bash
./start-services.sh
```

## Configuration Options

### LLM Provider Selection

Edit `BookStore.Service/appsettings.json` to choose your LLM provider:

```json
{
    "LLM": {
        "Provider": "Ollama" // Options: "Ollama", "Claude", "OpenAI", "Bedrock"
    }
}
```

**Providers:**

- **Ollama** (default) - Free, local LLM. No API key needed. Requires Docker.
- **Claude** - Anthropic's Claude API. Requires API key.
- **OpenAI** - GPT models. Requires API key.
- **Bedrock** - AWS-hosted models. Requires AWS credentials.

### Telemetry Configuration

**Console Export (Default):**

```json
{
    "Telemetry": {
        "Exporters": {
            "Console": {
                "Enabled": true
            }
        }
    }
}
```

**Prometheus (Recommended for Production):**

```json
{
    "Telemetry": {
        "Exporters": {
            "Prometheus": {
                "Enabled": true
            }
        }
    }
}
```

**TraceLoop (Optional):**

```json
{
    "Telemetry": {
        "TraceLoop": {
            "Enabled": true,
            "ApiKey": "your-traceloop-api-key"
        }
    }
}
```

## Testing

### Run Integration Tests

```bash
make test-integration
```

### Run K6 Performance Tests

```bash
make perf-smoke          # Quick test - 1 user, 2 min
make perf-load           # Load test - 10 users, 10 min
make perf-stress         # Stress test - 30 users, 15 min
```

### Generate HTML Reports

```bash
make perf-report
```

## Accessing Services

Once running, access:

- **API**: http://localhost:7002/swagger
- **Aspire Dashboard**: http://localhost:15888
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Health Check**: http://localhost:7002/health
- **Metrics**: http://localhost:7002/metrics

## Troubleshooting

### MongoDB Issues

If MongoDB has authentication issues on restart:

```bash
make run-aspire  # Auto-cleans volumes
```

Or manually:

```bash
docker volume ls | grep "mongodb-data" | xargs docker volume rm
```

### Port Conflicts

Check what's using ports:

```bash
lsof -Pi :7002   # BookStore API
lsof -Pi :7004   # Performance Service
lsof -Pi :11434  # Ollama
```

### Service Not Starting

```bash
make status       # Check service status
make logs-bookstore  # View logs
make restart      # Restart services
```

### Ollama Not Working

Pull the default model:

```bash
docker exec -it bookstore-ollama-perf ollama pull llama3.2
```

Or change model in `appsettings.json`:

```json
{
    "LLM": {
        "Providers": {
            "Ollama": {
                "Model": "mistral" // or "phi3", "codellama", etc.
            }
        }
    }
}
```

## Environment Variables (Alternative to appsettings.json)

You can also configure via environment variables:

```bash
export LLM__Provider="Ollama"
export LLM__Providers__Claude__ApiKey="sk-ant-api03-..."
export Telemetry__TraceLoop__Enabled="false"
```

## Security Notes

⚠️ **IMPORTANT:**

- Never commit `appsettings.json` files with real API keys
- Use `.example.json` files as templates
- Store sensitive keys in environment variables or secret managers in production
- The provided `.gitignore` prevents committing `appsettings.json` files

## Quick Reference

**Build & Run:**

```bash
make build          # Build solution
make run-aspire     # Start all services
make status         # Check service status
```

**Testing:**

```bash
make test-integration   # Run .NET tests
make perf-smoke        # Run smoke test
make perf-report       # Generate HTML report
```

**Monitoring:**

```bash
make grafana           # Open Grafana
make prometheus        # Open Prometheus
make aspire-dashboard  # Open Aspire Dashboard
```

**Cleanup:**

```bash
make stop-services     # Stop all services
make docker-clean      # Clean Docker resources
make reset            # Factory reset
```

## Next Steps

1. ✅ Configure your API keys
2. ✅ Run `make build`
3. ✅ Start services with `make run-aspire`
4. ✅ Verify at http://localhost:7002/swagger
5. ✅ Run smoke test: `make perf-smoke`
6. ✅ View Grafana dashboards at http://localhost:3000

For detailed documentation, see:

- **README.md** - Project overview
- **CLAUDE.md** - Development instructions
- **MONITORING_COMPARISON.md** - Monitoring details
