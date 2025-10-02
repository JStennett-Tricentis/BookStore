# BookStore Performance Testing POC - Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Postman[Postman/Newman]
        K6[K6 Load Tests]
    end

    subgraph "Entry Points"
        Swagger[Swagger UI<br/>:7002/swagger]
        API[BookStore API<br/>:7002]
    end

    subgraph "Application Services"
        direction TB
        BookStoreService[BookStore.Service<br/>Port 7002<br/>.NET 8 Web API]
        PerfService[Performance.Service<br/>Port 7004<br/>K6 Orchestration]

        subgraph "LLM Providers"
            direction LR
            ClaudeService[Claude Service<br/>$3/M in, $15/M out]
            OllamaService[Ollama Service<br/>FREE]
            OpenAIService[OpenAI Service<br/>GPT Models]
            BedrockService[Bedrock Service<br/>AWS Claude]
        end

        BookStoreService --> ClaudeService
        BookStoreService --> OllamaService
        BookStoreService --> OpenAIService
        BookStoreService --> BedrockService
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>:27017<br/>Books & Authors)]
        Redis[(Redis<br/>:6379<br/>Distributed Cache)]
    end

    subgraph "External LLM APIs"
        Claude[Claude API<br/>Anthropic]
        OllamaLocal[Ollama Container<br/>:11434<br/>Local LLM]
        OpenAI[OpenAI API<br/>GPT-4o]
        Bedrock[AWS Bedrock<br/>us-east-1]
    end

    subgraph "Observability Stack"
        direction TB

        subgraph "Metrics Collection"
            OTel[OpenTelemetry<br/>Instrumentation]
            PrometheusExporter[Prometheus Exporter<br/>/metrics]
        end

        subgraph "Storage & Visualization"
            Prometheus[Prometheus<br/>:9090<br/>Time-Series DB]
            Grafana[Grafana<br/>:3000<br/>10 Dashboards<br/>91 Widgets]
        end

        subgraph "Tracing"
            AspireDash[Aspire Dashboard<br/>:15888<br/>Distributed Tracing]
            TraceLoop[TraceLoop<br/>LLM Observability]
        end
    end

    subgraph "Orchestration"
        Aspire[.NET Aspire<br/>AppHost<br/>Service Orchestration]
        Docker[Docker Compose<br/>Container Management]
    end

    subgraph "CI/CD Pipeline"
        direction TB
        GitHub[GitHub Actions]

        subgraph "Workflows"
            PRWorkflow[PR Validation<br/>Build, Test, Scan]
            DeployWorkflow[Multi-Env Deploy<br/>Dev/Staging/Prod]
            PerfWorkflow[Daily Perf Tests<br/>Scheduled]
            SecurityWorkflow[CodeQL Security<br/>C# + JS]
        end

        GitHub --> PRWorkflow
        GitHub --> DeployWorkflow
        GitHub --> PerfWorkflow
        GitHub --> SecurityWorkflow
    end

    %% Client connections
    Browser --> Swagger
    Browser --> Grafana
    Browser --> AspireDash
    Postman --> API
    K6 --> API

    %% API connections
    Swagger --> BookStoreService
    API --> BookStoreService

    %% Service to Data
    BookStoreService --> MongoDB
    BookStoreService --> Redis
    PerfService --> Redis

    %% LLM connections
    ClaudeService -.->|HTTPS| Claude
    OllamaService -.->|HTTP| OllamaLocal
    OpenAIService -.->|HTTPS| OpenAI
    BedrockService -.->|AWS SDK| Bedrock

    %% Observability connections
    BookStoreService --> OTel
    PerfService --> OTel
    OTel --> PrometheusExporter
    PrometheusExporter --> Prometheus
    Prometheus --> Grafana

    BookStoreService -.->|Traces| AspireDash
    BookStoreService -.->|LLM Traces| TraceLoop

    %% Orchestration
    Aspire -.->|Manages| BookStoreService
    Aspire -.->|Manages| PerfService
    Aspire -.->|Manages| MongoDB
    Aspire -.->|Manages| Redis
    Aspire -.->|Manages| Prometheus
    Aspire -.->|Manages| Grafana

    Docker -.->|Alternative| BookStoreService
    Docker -.->|Alternative| PerfService

    %% Performance Testing
    PerfService -->|Orchestrates| K6
    K6 -.->|Results| Grafana

    classDef service fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef data fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef observability fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef external fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef orchestration fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef cicd fill:#fff9c4,stroke:#f57f17,stroke-width:2px

    class BookStoreService,PerfService,ClaudeService,OllamaService,OpenAIService,BedrockService service
    class MongoDB,Redis data
    class OTel,PrometheusExporter,Prometheus,Grafana,AspireDash,TraceLoop observability
    class Claude,OllamaLocal,OpenAI,Bedrock external
    class Aspire,Docker orchestration
    class GitHub,PRWorkflow,DeployWorkflow,PerfWorkflow,SecurityWorkflow cicd
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant API as BookStore API
    participant Cache as Redis Cache
    participant DB as MongoDB
    participant LLM as LLM Provider
    participant Metrics as Prometheus
    participant Grafana

    User->>API: POST /api/v1/Books/{id}/generate-summary

    API->>Cache: Check cached summary
    alt Cache Hit
        Cache-->>API: Return cached data
        API-->>User: Return summary (fast)
    else Cache Miss
        API->>DB: Get book details
        DB-->>API: Book data

        API->>LLM: Generate summary request
        Note over API,LLM: With OpenTelemetry tracing

        alt Ollama (Free)
            LLM-->>API: Summary ($0 cost)
        else Claude
            LLM-->>API: Summary (~$0.002)
        else OpenAI
            LLM-->>API: Summary (~$0.001-0.005)
        end

        API->>DB: Update book with summary
        API->>Cache: Cache summary

        API->>Metrics: Record metrics<br/>- Tokens used<br/>- Cost<br/>- Latency

        API-->>User: Return summary
    end

    Metrics->>Grafana: Scrape metrics every 15s
    Grafana->>User: Display in dashboards
```

## LLM Provider Architecture

```mermaid
graph LR
    subgraph "BookStore.Service"
        Controller[Books Controller]
        Factory[LLM Service Factory]
        Interface[ILLMService Interface]
    end

    subgraph "Provider Implementations"
        Claude[ClaudeService<br/>Anthropic SDK]
        Ollama[OllamaService<br/>OllamaSharp SDK]
        OpenAI[OpenAIService<br/>OpenAI SDK]
        Bedrock[BedrockService<br/>AWS SDK]
    end

    subgraph "Configuration"
        AppSettings[appsettings.json<br/>LLM:Provider = Ollama]
    end

    subgraph "Instrumentation"
        ActivitySource[ActivitySource<br/>Distributed Tracing]
        Meter[Meter Factory<br/>Metrics]
    end

    Controller --> Factory
    Factory --> Interface
    Interface --> Claude
    Interface --> Ollama
    Interface --> OpenAI
    Interface --> Bedrock

    AppSettings -.->|Configure| Factory

    Claude --> ActivitySource
    Ollama --> ActivitySource
    OpenAI --> ActivitySource
    Bedrock --> ActivitySource

    Claude --> Meter
    Ollama --> Meter
    OpenAI --> Meter
    Bedrock --> Meter

    ActivitySource -.->|Traces| AspireDashboard[Aspire Dashboard]
    Meter -.->|Metrics| PrometheusEndpoint[/metrics]

    classDef service fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef config fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef observability fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class Claude,Ollama,OpenAI,Bedrock service
    class AppSettings config
    class ActivitySource,Meter,AspireDashboard,PrometheusEndpoint observability
```

## Performance Testing Architecture

```mermaid
graph TB
    subgraph "Test Orchestration"
        Makefile[Makefile<br/>40+ Commands]
        PerfService[Performance Service<br/>:7004]
    end

    subgraph "K6 Test Scenarios"
        Smoke[Smoke Test<br/>1 user, 2 min]
        Load[Load Test<br/>10 users, 10 min]
        Stress[Stress Test<br/>30 users, 15 min]
        Spike[Spike Test<br/>50 users burst]
        Error[Error Scenarios<br/>Validation]
        AI[AI-Specific<br/>LLM Testing]
    end

    subgraph "Test Execution"
        K6Runner[K6 Engine]
        Docker[Docker Container]
    end

    subgraph "Results"
        JSON[JSON Output]
        HTMLReport[HTML Report<br/>Generator]
        Console[Console Output]
    end

    subgraph "Monitoring"
        RealTime[Real-time Grafana<br/>Dashboards]
        Prometheus[Prometheus<br/>Metrics]
    end

    Makefile --> PerfService
    Makefile --> K6Runner

    PerfService --> Docker
    Docker --> K6Runner

    K6Runner --> Smoke
    K6Runner --> Load
    K6Runner --> Stress
    K6Runner --> Spike
    K6Runner --> Error
    K6Runner --> AI

    Smoke --> JSON
    Load --> JSON
    Stress --> JSON
    Spike --> JSON
    Error --> JSON
    AI --> JSON

    JSON --> HTMLReport
    JSON --> Console

    K6Runner -.->|Metrics| Prometheus
    Prometheus --> RealTime

    classDef orchestration fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef test fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef execution fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef results fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class Makefile,PerfService orchestration
    class Smoke,Load,Stress,Spike,Error,AI test
    class K6Runner,Docker execution
    class JSON,HTMLReport,Console,RealTime results
```

## Monitoring & Observability Architecture

```mermaid
graph TB
    subgraph "Application"
        BookStore[BookStore.Service]
        PerfSvc[Performance.Service]
    end

    subgraph "Instrumentation Layer"
        OTel[OpenTelemetry SDK]

        subgraph "Signal Types"
            Traces[Distributed Traces<br/>Request flows]
            Metrics[Metrics<br/>Counters, Histograms]
            Logs[Structured Logs<br/>Events]
        end
    end

    subgraph "Exporters"
        Console[Console Exporter<br/>Development]
        PrometheusExp[Prometheus Exporter<br/>/metrics endpoint]
        OTLPExp[OTLP Exporter<br/>Optional]
    end

    subgraph "Collection"
        Prometheus[Prometheus<br/>:9090<br/>15s scrape interval]
    end

    subgraph "Visualization"
        Grafana[Grafana :3000]

        subgraph "10 Dashboards"
            Perf[Performance Testing<br/>12 panels]
            Errors[Errors & Diagnostics<br/>14 panels]
            LLM[LLM Metrics<br/>9 panels]
            Runtime[.NET Runtime<br/>8 panels]
            HTTP[HTTP & Kestrel<br/>10 panels]
            Threading[Threading<br/>8 panels]
            Deps[Dependencies<br/>9 panels]
            System[System Health<br/>7 panels]
            Demo[Demo Dashboard<br/>53 curated]
            Mega[MEGA Dashboard<br/>91 total widgets]
        end
    end

    subgraph "Specialized Tools"
        AspireDash[Aspire Dashboard<br/>:15888<br/>Request tracing]
        TraceLoop[TraceLoop<br/>LLM-specific observability]
    end

    BookStore --> OTel
    PerfSvc --> OTel

    OTel --> Traces
    OTel --> Metrics
    OTel --> Logs

    Traces --> Console
    Traces --> AspireDash
    Traces --> TraceLoop

    Metrics --> Console
    Metrics --> PrometheusExp

    Logs --> Console

    PrometheusExp --> Prometheus
    Prometheus --> Grafana

    Grafana --> Perf
    Grafana --> Errors
    Grafana --> LLM
    Grafana --> Runtime
    Grafana --> HTTP
    Grafana --> Threading
    Grafana --> Deps
    Grafana --> System
    Grafana --> Demo
    Grafana --> Mega

    classDef app fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef instrument fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef export fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef viz fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class BookStore,PerfSvc app
    class OTel,Traces,Metrics,Logs instrument
    class Console,PrometheusExp,OTLPExp,Prometheus export
    class Grafana,Perf,Errors,LLM,Runtime,HTTP,Threading,Deps,System,Demo,Mega viz
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Dev[Local Machine]
        Aspire[.NET Aspire<br/>make run-aspire]
        DevDocker[Docker Desktop]
    end

    subgraph "CI/CD - GitHub Actions"
        PR[PR Workflow<br/>Build, Test, Scan]
        Deploy[Deploy Workflow<br/>Multi-Environment]
        Perf[Performance Tests<br/>Daily Schedule]
        Security[CodeQL Scanning<br/>C# + JavaScript]
    end

    subgraph "Container Registry"
        GHCR[GitHub Container Registry<br/>ghcr.io]
    end

    subgraph "Environments"
        DevEnv[Development<br/>Auto-deploy]
        Staging[Staging<br/>Manual approval]
        Prod[Production<br/>Manual approval]
    end

    subgraph "Infrastructure"
        K8s[Kubernetes<br/>Optional]
        DockerHost[Docker Host<br/>Simple deployment]
    end

    Dev --> Aspire
    Dev --> DevDocker

    Dev -->|git push| PR
    PR --> Security
    PR -->|Build| GHCR

    PR -->|Success| Deploy
    Deploy --> DevEnv
    DevEnv -->|Approval| Staging
    Staging -->|Approval| Prod

    GHCR --> DevEnv
    GHCR --> Staging
    GHCR --> Prod

    Prod --> K8s
    Prod --> DockerHost

    Perf -.->|Daily| DevEnv

    classDef dev fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef cicd fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef env fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef infra fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class Dev,Aspire,DevDocker dev
    class PR,Deploy,Perf,Security,GHCR cicd
    class DevEnv,Staging,Prod env
    class K8s,DockerHost infra
```

## Network Architecture

```mermaid
graph TB
    subgraph "External Network"
        Internet[Internet]
    end

    subgraph "localhost Network"
        direction TB

        subgraph "Public Endpoints"
            Port7002[":7002 - BookStore API"]
            Port7004[":7004 - Performance Service"]
            Port3000[":3000 - Grafana UI"]
            Port9090[":9090 - Prometheus"]
            Port15888[":15888 - Aspire Dashboard"]
        end

        subgraph "Internal Services"
            Port27017[":27017 - MongoDB"]
            Port6379[":6379 - Redis"]
            Port11434[":11434 - Ollama"]
        end
    end

    subgraph "Docker Bridge Network"
        BookStoreContainer[bookstore-service]
        PerfContainer[performance-service]
        MongoContainer[mongodb]
        RedisContainer[redis]
        OllamaContainer[ollama]
        PrometheusContainer[prometheus]
        GrafanaContainer[grafana]
    end

    Internet -.->|HTTPS| Port7002
    Internet -.->|HTTPS| Port3000

    Port7002 --> BookStoreContainer
    Port7004 --> PerfContainer
    Port3000 --> GrafanaContainer
    Port9090 --> PrometheusContainer
    Port15888 -.->|Aspire| BookStoreContainer

    Port27017 --> MongoContainer
    Port6379 --> RedisContainer
    Port11434 --> OllamaContainer

    BookStoreContainer --> MongoContainer
    BookStoreContainer --> RedisContainer
    BookStoreContainer --> OllamaContainer

    PerfContainer --> RedisContainer

    PrometheusContainer --> BookStoreContainer
    PrometheusContainer --> PerfContainer

    GrafanaContainer --> PrometheusContainer

    classDef public fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef internal fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef container fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class Port7002,Port7004,Port3000,Port9090,Port15888 public
    class Port27017,Port6379,Port11434 internal
    class BookStoreContainer,PerfContainer,MongoContainer,RedisContainer,OllamaContainer,PrometheusContainer,GrafanaContainer container
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | .NET 8 | Application framework |
| **Web Framework** | ASP.NET Core | REST API |
| **Orchestration** | .NET Aspire | Service management |
| **Database** | MongoDB 7.0 | Document storage |
| **Cache** | Redis 7.2 | Distributed caching |
| **LLM - Free** | Ollama (llama3.2) | Local AI inference |
| **LLM - Cloud** | Claude, OpenAI, Bedrock | Cloud AI services |
| **Observability** | OpenTelemetry | Instrumentation |
| **Metrics** | Prometheus | Time-series data |
| **Visualization** | Grafana 10.2 | Dashboards |
| **Tracing** | Aspire Dashboard | Distributed tracing |
| **Load Testing** | K6 | Performance testing |
| **CI/CD** | GitHub Actions | Automation |
| **Containers** | Docker | Containerization |
| **API Testing** | Postman/Newman | Smoke tests |

## Port Reference

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| BookStore API | 7002 | HTTP | Public |
| BookStore API | 7001 | HTTPS | Public |
| Performance Service | 7004 | HTTP | Public |
| Performance Service | 7003 | HTTPS | Public |
| Aspire Dashboard | 15888 | HTTP | Local |
| Grafana | 3000 | HTTP | Public |
| Prometheus | 9090 | HTTP | Public |
| MongoDB | 27017 | TCP | Internal |
| Redis | 6379 | TCP | Internal |
| Ollama | 11434 | HTTP | Internal |

## File System Structure

```
/Users/j.stennett/TAIS/AiHubPerfExample/
├── BookStore.Service/                      # Main REST API
│   ├── Controllers/                        # API endpoints
│   │   └── BooksController.cs              # CRUD + AI summary
│   ├── Services/                           # Business logic
│   │   ├── ClaudeService.cs                # Claude integration
│   │   ├── OllamaService.cs                # Ollama integration
│   │   ├── OpenAIService.cs                # OpenAI integration
│   │   ├── BedrockService.cs               # AWS Bedrock
│   │   ├── LLMServiceFactory.cs            # Provider factory
│   │   └── ILLMService.cs                  # Provider interface
│   ├── appsettings.json                    # Configuration (gitignored)
│   └── appsettings.example.json            # Template
│
├── BookStore.Performance.Service/          # K6 orchestration
│   ├── Controllers/                        # Test management
│   ├── appsettings.json                    # Configuration
│   └── appsettings.example.json            # Template
│
├── BookStore.Aspire.AppHost/               # Orchestration
│   └── Program.cs                          # Service definitions
│
├── BookStore.Common/                       # Shared models
│   └── Models/                             # Book, Author
│
├── BookStore.Common.Instrumentation/       # OpenTelemetry
│   ├── OpenTelemetryExtensions.cs          # Setup
│   ├── TelemetrySettings.cs                # Configuration
│   └── TraceTags.cs                        # Semantic conventions
│
├── BookStore.Performance.Tests/            # K6 tests
│   ├── tests/                              # Test scripts
│   ├── scenarios/                          # Load patterns
│   ├── utils/                              # Helpers
│   └── generate-html-report.js             # Report generator
│
├── monitoring/                             # Observability config
│   ├── grafana/
│   │   ├── dashboards/                     # 10 JSON dashboards
│   │   ├── generate_dashboards.py          # Dashboard generator
│   │   └── datasources/                    # Prometheus config
│   └── prometheus/
│       └── prometheus.yml                  # Scrape config
│
├── .github/workflows/                      # CI/CD
│   ├── pr.yaml                             # PR validation
│   ├── deploy.yaml                         # Multi-env deploy
│   ├── performance.yaml                    # Daily tests
│   └── codeql.yaml                         # Security scanning
│
├── Makefile                                # 40+ automation commands
├── docker-compose.perf.yml                 # Full stack
├── README.md                               # Project overview
├── SETUP.md                                # Setup guide
├── CLAUDE.md                               # Development instructions
├── MONITORING_COMPARISON.md                # vs hub-services-latest
├── TRICENTIS_API_SIMULATOR_PLAN.md        # Future integration
└── ARCHITECTURE.md                         # This file
```

## Key Architectural Decisions

### 1. Multi-LLM Provider Strategy
- **Decision**: Support 4 LLM providers with unified interface
- **Rationale**: Flexibility, cost optimization, avoid vendor lock-in
- **Implementation**: Factory pattern with `ILLMService` interface

### 2. Ollama as Default
- **Decision**: Use free local Ollama by default
- **Rationale**: Zero cost for development and performance testing
- **Trade-off**: Slightly lower quality vs Claude, but unlimited usage

### 3. .NET Aspire for Orchestration
- **Decision**: Use Aspire over pure Docker Compose
- **Rationale**: Better .NET integration, built-in dashboard, easier debugging
- **Fallback**: Shell scripts provided when Aspire has issues

### 4. Prometheus + Grafana over Coralogix
- **Decision**: Self-hosted observability stack
- **Rationale**: $200-500/month cost savings, full control, portable
- **Benefit**: Same OpenTelemetry semantic conventions as hub-services-latest

### 5. K6 for Performance Testing
- **Decision**: K6 over JMeter or Gatling
- **Rationale**: JavaScript-based, modern, excellent HTTP/2 support
- **Integration**: Docker orchestration via Performance Service

### 6. OpenTelemetry Semantic Conventions
- **Decision**: Follow OpenTelemetry standard for LLM metrics
- **Rationale**: Industry standard, compatible with hub-services-latest
- **Tags**: `gen_ai.*`, `llm.*`, cost tracking, token counts

### 7. Configuration-Based Provider Selection
- **Decision**: Runtime provider switching via appsettings.json
- **Rationale**: No code changes needed, easy A/B testing
- **Pattern**: `LLM:Provider = "Ollama"` or query param `?provider=claude`

## Future Enhancements (Roadmap)

### Phase 1: API Simulator Integration
- Add Tricentis API Simulator support
- Zero-cost LLM mocking for CI/CD
- Simulation library from production traces
- Timeline: 2-3 days (see TRICENTIS_API_SIMULATOR_PLAN.md)

### Phase 2: Advanced Monitoring
- Custom metrics for business KPIs
- Alerting rules in Prometheus
- SLO/SLI tracking dashboards
- Timeline: 1 week

### Phase 3: Kubernetes Deployment
- Helm charts for K8s
- Horizontal pod autoscaling
- Service mesh integration (Linkerd/Istio)
- Timeline: 2 weeks

### Phase 4: Advanced LLM Features
- Streaming responses
- Token rate limiting
- Cost budgets per tenant
- A/B testing framework
- Timeline: 2 weeks

## Quick Reference

### Start Everything
```bash
make run-aspire      # Start with Aspire (recommended)
make run-services    # Start with shell scripts (fallback)
```

### Access Dashboards
```bash
make grafana-mega        # All 91 widgets
make grafana-dashboards  # Open all 8 specialized
make aspire-dashboard    # Request tracing
```

### Run Tests
```bash
make perf-smoke          # Quick validation
make perf-comprehensive  # Full test suite
make test-integration    # .NET integration tests
```

### Monitor Services
```bash
make status              # Check all services
make health-check        # Test endpoints
make logs-bookstore      # View logs
```

## Related Documentation

- **README.md** - Quick start and features
- **SETUP.md** - Detailed setup instructions
- **CLAUDE.md** - Development guidelines for AI assistants
- **MONITORING_COMPARISON.md** - Comparison with hub-services-latest
- **TRICENTIS_API_SIMULATOR_PLAN.md** - API simulator integration plan
