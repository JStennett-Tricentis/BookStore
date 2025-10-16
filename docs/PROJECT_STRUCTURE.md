# Project Structure Guide

## 📁 Where Everything Lives

```
BookStore/
├── 📖 README.md                          # Quick start guide
├── 📖 CLAUDE.md                          # Complete project documentation
├── 🔧 Makefile                           # All automation commands (see MAKEFILE_REFERENCE.md)
│
├── 📚 docs/                              # 📖 READ THESE FIRST
│   ├── LLM_PROVIDER_GUIDE.md            # ⭐ How to use Ollama/LM Studio/Claude/OpenAI
│   ├── MAKEFILE_REFERENCE.md            # ⭐ Complete Makefile command guide
│   ├── PROJECT_STRUCTURE.md             # ⭐ This file
│   ├── MIGRATION_TO_HUB_SERVICES.md     # Migration guide for production
│   └── MIGRATION_CHECKLIST.md           # Phase 1 checklist
│
├── 🎯 BookStore.Service/                 # Main API Service
│   ├── appsettings.json                 # ⚙️ PRIMARY CONFIG FILE
│   ├── appsettings.Development.json     # Dev overrides (optional)
│   ├── appsettings.example.json         # Template for new users
│   ├── Program.cs                       # Service startup & DI
│   ├── Controllers/                     # API endpoints
│   │   ├── BooksController.cs          # CRUD + AI summary endpoint
│   │   ├── AuthorsController.cs        # Author management
│   │   └── ErrorTestController.cs      # Error testing endpoints
│   └── Services/                        # Business logic
│       ├── ILLMService.cs              # Common LLM interface
│       ├── ILLMServiceFactory.cs       # Provider selection
│       ├── OllamaService.cs            # Ollama integration
│       ├── LMStudioService.cs          # LM Studio integration ⭐ NEW
│       ├── ClaudeService.cs            # Claude integration
│       ├── OpenAIService.cs            # OpenAI integration
│       ├── BedrockService.cs           # AWS Bedrock integration
│       ├── BookService.cs              # Book business logic
│       └── AuthorService.cs            # Author business logic
│
├── 🎯 BookStore.Performance.Service/     # K6 Test Orchestration
│   ├── appsettings.json                 # Performance service config
│   ├── Controllers/                     # API to trigger tests
│   └── wwwroot/                         # 🌐 Web UI Dashboard
│       ├── index.html                   # Performance testing dashboard
│       └── README.md                    # Dashboard documentation
│
├── 🎯 BookStore.Aspire.AppHost/          # .NET Aspire Orchestration
│   ├── Program.cs                       # Orchestration setup
│   └── appsettings.json                 # Aspire config (API Simulator toggle)
│
├── 📦 BookStore.Common/                  # Shared models
│   └── Models/                          # Book, Author DTOs
│
├── 📦 BookStore.Common.Instrumentation/  # OpenTelemetry Setup
│   └── OpenTelemetryExtensions.cs       # OTel configuration
│
├── 🧪 BookStore.Service.Tests.Integration/ # .NET Integration Tests
│   └── Tests/                           # API integration tests
│
├── 🧪 BookStore.Performance.Tests/       # K6 Load Tests
│   ├── scenarios/                       # 🎯 Test scenarios
│   │   ├── smoke-test.js               # Quick 2-min test
│   │   ├── load-test.js                # 10-user, 10-min
│   │   ├── stress-test.js              # 30-user, 15-min
│   │   ├── spike-test.js               # Burst to 50 users
│   │   ├── chaos-test.js               # Random spikes + errors + LLM
│   │   ├── extreme-chaos-test.js       # 🔥 500+ users (WILL BREAK)
│   │   ├── ai-load.js                  # AI-focused load test
│   │   ├── ai-stress.js                # AI stress test
│   │   └── mixed-workload.js           # CRUD + AI mix
│   ├── tests/                           # Individual endpoint tests
│   │   ├── books.js                    # Book CRUD tests
│   │   ├── authors.js                  # Author tests
│   │   ├── errors.js                   # Error handling tests
│   │   └── ai-summary.js               # AI summary tests
│   ├── utils/                           # Test utilities
│   └── config/                          # Test configuration
│
├── 📊 monitoring/                        # Monitoring Configuration
│   ├── prometheus/
│   │   └── prometheus.yml              # Prometheus config
│   └── grafana/
│       ├── dashboards/                 # 10 Grafana dashboards (91 widgets)
│       │   ├── bookstore-performance.json
│       │   ├── bookstore-errors.json
│       │   ├── bookstore-llm-metrics.json
│       │   ├── bookstore-dotnet-runtime.json
│       │   ├── bookstore-http-kestrel.json
│       │   ├── bookstore-threading.json
│       │   ├── bookstore-dependencies.json
│       │   ├── bookstore-system-health.json
│       │   ├── bookstore-demo.json     # 53 curated panels
│       │   └── bookstore-mega.json     # All 91 widgets
│       └── *.py                        # Dashboard generation scripts
│
└── 🧪 tests/                             # Other Tests
    └── postman/                         # Postman/Newman smoke tests

```

---

## ⚙️ Configuration Files (What To Edit)

### Primary Configuration: `BookStore.Service/appsettings.json`

**This is the main file you edit for:**
- ✅ LLM Provider selection (`LLM.Provider`)
- ✅ Provider API keys and models (`LLM.Providers.{Provider}`)
- ✅ MongoDB connection (`Database.ConnectionString`)
- ✅ Redis connection (`Redis.ConnectionString`)
- ✅ OpenTelemetry settings (`Telemetry`)

**Example:**
```json
{
  "LLM": {
    "Provider": "LMStudio",  // ⭐ Change this to switch providers
    "Providers": {
      "Ollama": {
        "Url": "http://localhost:11434",
        "Model": "gemma3:1b",
        "Enabled": true
      },
      "LMStudio": {
        "Url": "http://localhost:1234",
        "Model": "lmstudio-community/Phi-3.1-mini-4k-instruct-GGUF",
        "Enabled": true
      },
      "Claude": {
        "ApiKey": "sk-ant-...",  // ⭐ Add your key here
        "Model": "claude-3-5-sonnet-20241022",
        "Enabled": true
      }
    }
  }
}
```

### Other Configuration Files

| File | Purpose | When To Edit |
|------|---------|-------------|
| `BookStore.Service/appsettings.Development.json` | Dev-specific overrides | Optional, only if you need different dev settings |
| `BookStore.Service/appsettings.example.json` | Template for new users | Never edit, use as reference |
| `BookStore.Aspire.AppHost/appsettings.json` | Aspire orchestration | Only to enable/disable API Simulator |
| `BookStore.Performance.Service/appsettings.json` | Performance service | Rarely (K6 Docker settings) |
| `monitoring/prometheus/prometheus.yml` | Prometheus scraping | Rarely (add new metrics) |

---

## 🎯 Quick Task Guide

### "I want to test with a different LLM provider"

1. Edit: `BookStore.Service/appsettings.json`
2. Change: `"Provider": "Ollama"` to `"Provider": "LMStudio"` (or Claude, OpenAI, Bedrock)
3. Restart: `make run-aspire`
4. Test: `make perf-ai-smoke`

**See:** [docs/LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)

---

### "I want to run a quick performance test"

```bash
make perf-smoke        # 2 min, basic test
make perf-ai-smoke     # 3 min, AI endpoints
```

**See:** [docs/MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md)

---

### "I want to see live metrics during a test"

```bash
make perf-workspace    # Opens Dashboard + Grafana + Aspire
# Then click "Start Test" in Dashboard
# Switch to Grafana tab to watch metrics
```

---

### "I want to add a new LLM provider"

1. Create: `BookStore.Service/Services/MyProviderService.cs`
   - Implement `ILLMService`
   - Add token counting and metrics
2. Register: `BookStore.Service/Program.cs`
   - Add `builder.Services.AddSingleton<MyProviderService>()`
   - Add case in switch statement
3. Configure: `BookStore.Service/appsettings.json`
   - Add section in `LLM.Providers.MyProvider`
4. Update: `BookStore.Service/Services/ILLMServiceFactory.cs`
   - Add provider to factory

**Example:** See `LMStudioService.cs` for reference implementation

---

### "I want to add a new K6 test scenario"

1. Create: `BookStore.Performance.Tests/scenarios/my-test.js`
2. Add Makefile target: `Makefile`
   ```makefile
   perf-my-test:
       cd BookStore.Performance.Tests && k6 run scenarios/my-test.js
   ```
3. Test: `make perf-my-test`

**Templates:** See `scenarios/smoke-test.js` for a simple example

---

### "I want to add a new Grafana dashboard"

1. Create: `monitoring/grafana/dashboards/my-dashboard.json`
2. Export from Grafana UI or use Python scripts:
   ```bash
   cd monitoring/grafana
   python3 generate_demo_dashboard.py  # As reference
   ```
3. Access via Grafana UI at http://localhost:3333

---

### "I want to understand what a Makefile command does"

```bash
make help              # List all commands
cat Makefile           # Read the source
```

**Or see:** [docs/MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md)

---

## 📝 Common File Locations Cheat Sheet

| What You Need | Where It Lives |
|---------------|---------------|
| **Change LLM provider** | `BookStore.Service/appsettings.json` |
| **Add API key** | `BookStore.Service/appsettings.json` |
| **View API endpoints** | `BookStore.Service/Controllers/*.cs` |
| **LLM integration code** | `BookStore.Service/Services/*Service.cs` |
| **Run quick test** | `make perf-smoke` |
| **View metrics** | `make grafana-mega` |
| **K6 test scenarios** | `BookStore.Performance.Tests/scenarios/*.js` |
| **Grafana dashboards** | `monitoring/grafana/dashboards/*.json` |
| **OpenTelemetry setup** | `BookStore.Common.Instrumentation/` |
| **Integration tests** | `BookStore.Service.Tests.Integration/` |
| **Makefile commands** | `Makefile` or [MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md) |
| **Complete docs** | `CLAUDE.md` |

---

## 🔍 Finding Things

### "Where is the LLM integration code?"
- `BookStore.Service/Services/` - All LLM provider implementations
- `BookStore.Service/Controllers/BooksController.cs` - `/generate-summary` endpoint

### "Where are the performance tests?"
- `BookStore.Performance.Tests/scenarios/` - Test scenarios
- `BookStore.Performance.Tests/tests/` - Individual endpoint tests

### "Where is the monitoring configuration?"
- `monitoring/prometheus/prometheus.yml` - Prometheus config
- `monitoring/grafana/dashboards/` - All 10 Grafana dashboards

### "Where is the Aspire orchestration?"
- `BookStore.Aspire.AppHost/Program.cs` - Orchestration logic
- Starts: MongoDB, Redis, Prometheus, Grafana, API, Performance Service

### "Where are the OpenTelemetry metrics defined?"
- `BookStore.Common.Instrumentation/` - OTel setup
- Individual service files - Custom metrics (e.g., `OllamaService.cs`)

---

## 🚀 Quick Start Paths

### Path 1: Just Run It
```bash
make run-aspire      # Start everything
make perf-smoke      # Run test
make grafana-mega    # View metrics
```

### Path 2: Performance Testing Focus
```bash
make run-aspire           # Start services
make perf-workspace       # Open workspace (3 tabs)
# Click "Start Test" in Dashboard tab
# Watch metrics in Grafana tab
```

### Path 3: LLM Provider Comparison
```bash
# Setup Ollama
ollama pull gemma3:1b
# Edit appsettings.json: Provider = "Ollama"
make run-aspire
make perf-ai-smoke

# Setup LM Studio
# Download from lmstudio.ai, load model, start server
# Edit appsettings.json: Provider = "LMStudio"
make restart
make perf-ai-smoke

# Compare metrics in Grafana
make grafana-mega
```

### Path 4: Development Workflow
```bash
make run-aspire              # Start services
make swagger                 # Test API manually
make test-integration        # Run .NET tests
make perf-load               # Run load test
make grafana-mega            # View metrics
```

---

## 📚 Documentation Hierarchy

1. **README.md** - 30-second overview
2. **This file** - Where everything lives
3. **[MAKEFILE_REFERENCE.md](MAKEFILE_REFERENCE.md)** - All commands
4. **[LLM_PROVIDER_GUIDE.md](LLM_PROVIDER_GUIDE.md)** - LLM setup & testing
5. **CLAUDE.md** - Complete technical documentation

---

## 💡 Key Principles

- **Single source of truth**: `BookStore.Service/appsettings.json`
- **One command to rule them all**: `make run-aspire`
- **Web UI for everything**: Dashboard, Grafana, Aspire, Swagger
- **Zero-cost testing**: Use Ollama or LM Studio
- **Real-time visibility**: All metrics → Grafana automatically
