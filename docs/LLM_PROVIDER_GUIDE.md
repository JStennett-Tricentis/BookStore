# LLM Provider Configuration Guide

## Quick Start

### 1. Choose Your LLM Provider

Edit `BookStore.Service/appsettings.json` and set the `LLM.Provider` field:

```json
{
  "LLM": {
    "Provider": "LMStudio"  // Options: "Ollama", "LMStudio", "Claude", "OpenAI", "Bedrock"
  }
}
```

### 2. Provider-Specific Setup

#### **Ollama (Free, Local)**
- Install: [ollama.com/download](https://ollama.com/download)
- Pull a model: `ollama pull llama3.2` or `ollama pull gemma3:1b`
- Start: `ollama serve` (runs on port 11434)
- Config in `appsettings.json`:
  ```json
  "Ollama": {
    "Url": "http://localhost:11434",
    "Model": "gemma3:1b",
    "Enabled": true
  }
  ```
- Set provider: `"Provider": "Ollama"`

#### **LM Studio (Free, Local)** ⭐ NEW
- Install: [lmstudio.ai](https://lmstudio.ai)
- Download any model from the UI
- Start local server (default port 1234)
- Config in `appsettings.json`:
  ```json
  "LMStudio": {
    "Url": "http://localhost:1234",
    "Model": "lmstudio-community/Phi-3.1-mini-4k-instruct-GGUF",
    "Enabled": true
  }
  ```
- Set provider: `"Provider": "LMStudio"`

#### **Claude (Paid, API)**
- Get API key: [console.anthropic.com](https://console.anthropic.com)
- Config in `appsettings.json`:
  ```json
  "Claude": {
    "ApiKey": "sk-ant-api03-YOUR_KEY_HERE",
    "Model": "claude-3-5-sonnet-20241022",
    "Enabled": true
  }
  ```
- Set provider: `"Provider": "Claude"`

#### **OpenAI (Paid, API)**
- Get API key: [platform.openai.com](https://platform.openai.com)
- Config in `appsettings.json`:
  ```json
  "OpenAI": {
    "ApiKey": "sk-proj-YOUR_KEY_HERE",
    "Model": "gpt-4o",
    "Enabled": true
  }
  ```
- Set provider: `"Provider": "OpenAI"`

#### **AWS Bedrock (Paid, AWS)**
- Setup AWS credentials
- Config in `appsettings.json`:
  ```json
  "Bedrock": {
    "Region": "us-east-1",
    "Model": "us.anthropic.claude-sonnet-4-20250514-v1:0",
    "Enabled": true
  }
  ```
- Set provider: `"Provider": "Bedrock"`

---

## Running Performance Tests

### Against Current Provider (from appsettings.json)

```bash
# Quick tests
make perf-smoke        # 1 user, 2 min
make perf-load         # 10 users, 10 min
make perf-stress       # 30 users, 15 min

# AI-focused tests (uses current provider)
make perf-ai-smoke     # 1-2 AI requests, 3 min
make perf-ai-load      # 3-5 users calling LLM, 12 min
make perf-ai-stress    # 5-15 users calling LLM, 17 min

# Mixed workload (CRUD + AI)
make perf-mixed        # 20% LLM traffic
make perf-mixed-heavy  # 50% LLM traffic

# Chaos testing (exercises all endpoints)
make perf-chaos        # Random spikes, errors, LLM, ~4 min
```

### Override Provider in URL

You can test a specific provider without changing appsettings.json:

```bash
# Test with Ollama
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=ollama

# Test with LM Studio
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=lmstudio

# Test with Claude
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=claude

# Test with OpenAI
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=openai

# Test with Bedrock
curl -X POST http://localhost:7002/api/v1/Books/{id}/generate-summary?provider=bedrock
```

---

## Starting Services

### Option 1: Aspire (Recommended)
```bash
make run-aspire
```
- Starts everything: API, MongoDB, Redis, Prometheus, Grafana
- Dashboard at: http://localhost:15888

### Option 2: Standalone
```bash
make run-services
```
- Uses startup scripts instead of Aspire
- Same services, no dashboard

### Option 3: Manual
```bash
# Terminal 1: Start dependencies
docker run -d --name mongodb -p 27017:27017 mongo:7
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Terminal 2: Start API
cd BookStore.Service
dotnet run
```

---

## Configuration Files

### Main Configuration
- **`BookStore.Service/appsettings.json`** - Production/default config
  - This is where you set `LLM.Provider`
  - Contains all provider configurations

### Development Override (Optional)
- **`BookStore.Service/appsettings.Development.json`** - Dev-specific overrides
  - Only loaded when `ASPNETCORE_ENVIRONMENT=Development`
  - Overrides specific settings from appsettings.json

### Example Template
- **`BookStore.Service/appsettings.example.json`** - Template for new users
  - Copy to `appsettings.json` if starting fresh
  - Remove your API keys before committing

---

## Monitoring Dashboards

All dashboards show LLM metrics for ALL providers:

```bash
# Quick access
make grafana              # Open Grafana
make grafana-mega         # All 91 metrics in one view
make prometheus           # Open Prometheus
make aspire-dashboard     # Open Aspire Dashboard

# Performance testing dashboard
make perf-dashboard       # Web UI for running K6 tests
make perf-workspace       # Opens Dashboard + Grafana + Aspire
```

Grafana dashboards automatically detect which provider is active and show:
- Token usage (input/output/total)
- Cost per request (USD)
- Latency (ms)
- Request rates
- Error rates

---

## Troubleshooting

### "Connection refused" for Ollama
```bash
ollama serve  # Start Ollama server
ollama list   # Check installed models
ollama pull llama3.2  # Download a model
```

### "Connection refused" for LM Studio
- Open LM Studio app
- Click "Local Server" tab
- Click "Start Server"
- Check port matches appsettings.json (default: 1234)

### "API key invalid" for Claude/OpenAI
- Check API key in appsettings.json
- Verify key has not expired
- Check account has credits/quota

### Service won't start
```bash
# Check ports are free
lsof -i :7002  # BookStore API
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Clean restart
make stop-services
make clean
make run-aspire
```

### MongoDB "connection timeout"
```bash
# Check MongoDB is running
docker ps | grep mongo

# Start if not running
docker run -d --name mongodb -p 27017:27017 mongo:7
```

---

## Cost Comparison

| Provider | Cost | Notes |
|----------|------|-------|
| **Ollama** | FREE | Local, no API calls |
| **LM Studio** | FREE | Local, no API calls |
| **Claude** | ~$3/1M tokens | Requires API key |
| **OpenAI GPT-4** | ~$10/1M tokens | Requires API key |
| **OpenAI GPT-3.5** | ~$0.50/1M tokens | Requires API key |
| **Bedrock** | Varies | AWS pricing |

For **performance testing**, use Ollama or LM Studio to avoid costs.

---

## Advanced: Provider Switching During Tests

You can run tests against multiple providers simultaneously:

```bash
# Terminal 1: Set provider to Ollama
sed -i '' 's/"Provider": ".*"/"Provider": "Ollama"/' BookStore.Service/appsettings.json
make run-aspire

# Terminal 2: Run tests
make perf-ai-smoke

# Switch provider
sed -i '' 's/"Provider": "Ollama"/"Provider": "LMStudio"/' BookStore.Service/appsettings.json
# Restart service to pick up change

# Run same tests with different provider
make perf-ai-smoke
```

Or use the query parameter to avoid restarts:
```bash
# K6 test with specific provider
k6 run --env PROVIDER=ollama BookStore.Performance.Tests/scenarios/ai-load.js
k6 run --env PROVIDER=lmstudio BookStore.Performance.Tests/scenarios/ai-load.js
```

---

## Summary

1. **Edit one file**: `BookStore.Service/appsettings.json`
2. **Set `LLM.Provider`** to your choice
3. **Run services**: `make run-aspire`
4. **Run tests**: `make perf-ai-smoke` or similar
5. **View metrics**: `make grafana-mega`

**For zero-cost testing**: Use Ollama or LM Studio
**For production**: Use Claude or OpenAI with API keys
