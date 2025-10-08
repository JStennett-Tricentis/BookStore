# Tricentis API Simulator Integration Plan

## Executive Summary

Integrate the Tricentis API Simulator (used in hub-services-latest) into
BookStore POC to enable **cost-free LLM performance testing** by mocking AI
provider responses. This eliminates API costs during development and allows
unlimited load testing.

## Cost Savings Analysis

### Current State (BookStore POC)

- **Ollama**: $0 (free, local)
- **Claude**: $3/M input, $15/M output tokens (~$0.99 per 540 requests in testing)
- **OpenAI**: $2.50-10/M tokens depending on model
- **Bedrock**: Similar to Claude pricing

### With API Simulator

- **All Providers**: $0 (mocked responses)
- **Performance Testing**: Unlimited requests without cost
- **CI/CD**: No API keys needed in pipelines
- **Development**: Faster iteration without rate limits

**Estimated Monthly Savings**: $100-500 (varies by testing volume)

## Architecture Overview

### What is the Tricentis API Simulator?

From hub-services-latest analysis:

- Docker container: `ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci:0.2`
- Mocks external API responses (AI providers, external services)
- Configurable via YAML simulations
- Three endpoints:
  - Internal API: Port 17070
  - UI Dashboard: Port 28880
  - Service API: Port 5020 (AI Hub API mock)

### Integration Points in BookStore POC

```text
┌─────────────────────────────────────────────────────┐
│                     BookStore.Service               │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   │
│  │  Ollama    │   │   Claude   │   │  OpenAI    │   │
│  │  Service   │   │  Service   │   │  Service   │   │
│  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   │
│        │                │                │          │
│        └────────────────┼────────────────┘          │
│                         │                           │
│                    ┌────▼────┐                      │
│                    │ ILLMProvider Interface         │
│                    │ (New Abstraction)              │
│                    └────┬────┘                      │
│                         │                           │
│           ┌─────────────┴─────────────┐             │
│           │                           │             │
│      ┌────▼────┐              ┌──────▼──────┐       │
│      │  Real   │              │  Simulator  │       │
│      │Provider │              │  Provider   │       │
│      └─────────┘              └──────┬──────┘       │
└──────────────────────────────────────┼──────────────┘
                                       │
                               ┌───────▼────────┐
                               │  API Simulator │
                               │  Container     │
                               │  (Port 5020)   │
                               └────────────────┘
```

## Implementation Plan

### Phase 1: Infrastructure Setup (1-2 hours)

#### 1.1 Add Simulator Service Constants

**File**: `BookStore.Aspire.AppHost/ServiceConstants.cs` (new)

```csharp
public static class ServiceConstants
{
    // Existing services
    public const string BookStoreServiceName = "bookstore-service";
    public const string PerformanceServiceName = "performance-service";
    public const string MongoDbServiceName = "mongodb";
    public const string RedisServiceName = "redis";

    // API Simulator
    public const string ApiSimulatorServiceName = "api-simulator";
    public const string ApiSimulatorContainerImage = "ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci";
    public const int ApiSimulatorInternalApiPort = 17070;
    public const int ApiSimulatorUiPort = 28880;
    public const int ApiSimulatorServicePort = 5020;
    public static readonly string ApiSimulatorBaseUrl = $"http://localhost:{ApiSimulatorServicePort}";
}
```

#### 1.2 Create Simulator Configuration

**File**: `BookStore.Aspire.AppHost/appsettings.simulator.yml` (new)

```yaml
Simulator:
  Workspace: /workspace/simulations
  Identifier: "bookstore-simulator"
  FormatDate: "yyyy-MM-dd"
  FormatTime: "yyyy-MM-ddTHH:mm:ss.fffZ"

  Variables:
    Simulator__Variables__Model_Name: "claude-3-5-sonnet-20241022"
    Simulator__Variables__Book_Title: "Sample Book"
    Simulator__Variables__Author_Name: "Sample Author"

  IdleTimeout: 60
  Environment: dev

Logging:
  LogLevel:
    Default: Information
  File:
    FileName: "Simulator_{date}.log"
    LogLevel:
      Default: Warning
```

#### 1.3 Create Aspire Extension

**File**: `BookStore.Aspire.AppHost/Extensions/ApiSimulatorExtensions.cs` (new)

```csharp
public static class ApiSimulatorExtensions
{
    public static IResourceBuilder<ContainerResource>? AddApiSimulatorIfEnabled(
        this IDistributedApplicationBuilder builder)
    {
        var enabled = builder.Configuration.GetValue("ApiSimulatorEnabled", false);
        if (!enabled) return null;

        return builder
            .AddContainer(ServiceConstants.ApiSimulatorServiceName,
                         ServiceConstants.ApiSimulatorContainerImage, "0.2")
            .WithHttpEndpoint(port: ServiceConstants.ApiSimulatorInternalApiPort,
                            targetPort: ServiceConstants.ApiSimulatorInternalApiPort,
                            name: "internal-api")
            .WithHttpEndpoint(port: ServiceConstants.ApiSimulatorUiPort,
                            targetPort: ServiceConstants.ApiSimulatorUiPort,
                            name: "ui")
            .WithHttpEndpoint(port: ServiceConstants.ApiSimulatorServicePort,
                            targetPort: ServiceConstants.ApiSimulatorServicePort,
                            name: "service")
            .WithBindMount("./simulations", "/workspace/simulations")
            .WithBindMount("./appsettings.simulator.yml", "/app/appsettings.yml",
                          isReadOnly: true)
            .WithEnvironment("API_SIMULATOR_CONFIG_PATH", "/app/appsettings.yml")
            .WithEnvironment("API_SIMULATOR_LOG_LEVEL", "Information");
    }

    public static IResourceBuilder<ProjectResource> AddApiSimulatorConfiguration(
        this IResourceBuilder<ProjectResource> builder)
    {
        var appBuilder = builder.ApplicationBuilder;
        var apiSimulator = appBuilder.Resources
            .FirstOrDefault(r => r.Name == ServiceConstants.ApiSimulatorServiceName);

        if (apiSimulator == null) return builder;

        var apiSimulatorBuilder = appBuilder
            .CreateResourceBuilder<ContainerResource>(ServiceConstants.ApiSimulatorServiceName);

        return builder
            .WaitFor(apiSimulatorBuilder)
            .WithEnvironment("LLM__SimulatorBaseUrl", ServiceConstants.ApiSimulatorBaseUrl);
    }
}
```

#### 1.4 Update AppHost Program.cs

**File**: `BookStore.Aspire.AppHost/Program.cs`

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Existing resources...
var mongodb = builder.AddMongoDB("mongodb");
var redis = builder.AddRedis("redis");

// Add API Simulator conditionally
var apiSimulator = builder.AddApiSimulatorIfEnabled();

var bookstoreService = builder.AddProject<Projects.BookStore_Service>("bookstore-service")
    .WithReference(mongodb)
    .WithReference(redis)
    .AddApiSimulatorConfiguration(); // Add simulator config if enabled

builder.Build().Run();
```

### Phase 2: Service Abstraction (2-3 hours)

#### 2.1 Create LLM Provider Interface

**File**: `BookStore.Service/Services/ILlmProvider.cs` (new)

```csharp
public interface ILlmProvider
{
    Task<LlmResponse> GenerateSummaryAsync(
        string prompt,
        LlmOptions options,
        CancellationToken cancellationToken = default);

    string ProviderName { get; }
}

public class LlmResponse
{
    public string Content { get; set; } = string.Empty;
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public double CostUsd { get; set; }
    public string Model { get; set; } = string.Empty;
    public TimeSpan Latency { get; set; }
}

public class LlmOptions
{
    public string Model { get; set; } = string.Empty;
    public int MaxTokens { get; set; } = 500;
    public decimal Temperature { get; set; } = 0.7m;
}
```

#### 2.2 Create Simulator LLM Service

**File**: `BookStore.Service/Services/SimulatorLlmService.cs` (new)

```csharp
public class SimulatorLlmService : IClaudeService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SimulatorLlmService> _logger;
    private readonly ActivitySource _activitySource;
    private readonly Counter<long> _inputTokensCounter;
    private readonly Counter<long> _outputTokensCounter;
    private readonly Histogram<double> _costHistogram;
    private readonly string _simulatorBaseUrl;

    public SimulatorLlmService(
        IConfiguration configuration,
        ILogger<SimulatorLlmService> logger,
        ActivitySource activitySource,
        IMeterFactory meterFactory,
        IHttpClientFactory httpClientFactory)
    {
        _simulatorBaseUrl = configuration["LLM:SimulatorBaseUrl"]
            ?? "http://localhost:5020";
        _httpClient = httpClientFactory.CreateClient("Simulator");
        _logger = logger;
        _activitySource = activitySource;

        var meter = meterFactory.Create("BookStore.Service.Simulator");
        _inputTokensCounter = meter.CreateCounter<long>("simulator.tokens.input");
        _outputTokensCounter = meter.CreateCounter<long>("simulator.tokens.output");
        _costHistogram = meter.CreateHistogram<double>("simulator.cost.usd");
    }

    public async Task<string> GenerateBookSummaryAsync(
        string title, string author, string? description,
        CancellationToken cancellationToken = default)
    {
        using var activity = _activitySource.StartActivity(
            "simulator.generate_summary", ActivityKind.Client);

        var prompt = BuildPrompt(title, author, description);
        var startTime = DateTimeOffset.UtcNow;

        try
        {
            // Call simulator endpoint
            var request = new
            {
                prompt = prompt,
                model = "claude-3-5-sonnet-20241022",
                max_tokens = 500
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_simulatorBaseUrl}/api/llm/generate",
                request,
                cancellationToken);

            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<SimulatorResponse>(
                cancellationToken: cancellationToken);

            var latency = (DateTimeOffset.UtcNow - startTime).TotalMilliseconds;
            var summary = result?.Content ?? "Unable to generate summary";

            // Simulate realistic token counts
            var inputTokens = EstimateTokenCount(prompt);
            var outputTokens = EstimateTokenCount(summary);

            // Simulator cost is always $0
            const double cost = 0.0;

            // Record metrics
            _inputTokensCounter.Add(inputTokens);
            _outputTokensCounter.Add(outputTokens);
            _costHistogram.Record(cost);

            // Add trace tags
            activity?.SetTag("gen_ai.system", "simulator");
            activity?.SetTag("gen_ai.request.model", "claude-3-5-sonnet-20241022");
            activity?.SetTag("gen_ai.usage.input_tokens", inputTokens);
            activity?.SetTag("gen_ai.usage.output_tokens", outputTokens);
            activity?.SetTag("gen_ai.cost.usd", cost);
            activity?.SetStatus(ActivityStatusCode.Ok);

            _logger.LogInformation(
                "Generated summary using Simulator. Tokens: {Input}/{Output}, " +
                "Cost: $0 (FREE), Latency: {Latency}ms",
                inputTokens, outputTokens, latency);

            return summary;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            _logger.LogError(ex, "Failed to generate summary using Simulator");
            throw;
        }
    }

    private static string BuildPrompt(string title, string author, string? description)
    {
        var prompt = $"Generate a concise 2-3 sentence summary for \"{title}\" by {author}.";
        if (!string.IsNullOrEmpty(description))
            prompt += $" Context: {description}";
        return prompt;
    }

    private static int EstimateTokenCount(string text) =>
        (int)Math.Ceiling(text.Length / 4.0);

    private class SimulatorResponse
    {
        public string Content { get; set; } = string.Empty;
    }
}
```

#### 2.3 Update Service Registration

**File**: `BookStore.Service/Program.cs`

```csharp
// LLM Service registration with simulator support
var llmProvider = builder.Configuration["LLM:Provider"] ?? "Claude";
var useSimulator = builder.Configuration.GetValue("LLM:UseSimulator", false);

if (useSimulator)
{
    // Use simulator for all providers (cost-free testing)
    builder.Services.AddHttpClient("Simulator");
    builder.Services.AddSingleton<IClaudeService, SimulatorLlmService>();
}
else
{
    // Use real providers
    switch (llmProvider.ToLowerInvariant())
    {
        case "ollama":
            builder.Services.AddSingleton<IClaudeService, OllamaService>();
            break;
        case "claude":
            builder.Services.AddSingleton<IClaudeService, ClaudeService>();
            break;
        case "openai":
            builder.Services.AddSingleton<IClaudeService, OpenAIService>();
            break;
        default:
            builder.Services.AddSingleton<IClaudeService, ClaudeService>();
            break;
    }
}
```

### Phase 3: Simulation Definitions (1-2 hours)

#### 3.1 Create Simulations Directory Structure

```yaml
BookStore.Aspire.AppHost/
├── simulations/
│   ├── claude/
│   │   ├── generate-summary.json
│   │   └── error-scenarios.json
│   ├── openai/
│   │   ├── generate-completion.json
│   │   └── rate-limit.json
│   └── shared/
│       └── common-responses.json
```

#### 3.2 Sample Simulation: Claude Summary Generation

**File**: `simulations/claude/generate-summary.json`

```json
{
  "name": "Claude Generate Summary",
  "endpoint": "/api/llm/generate",
  "method": "POST",
  "responses": [
    {
      "condition": "$.prompt contains 'Gatsby'",
      "response": {
        "status": 200,
        "body": {
          "content": "The Great Gatsby is F. Scott Fitzgerald's masterpiece about the American Dream in the 1920s. The story follows Jay Gatsby's obsessive pursuit of his lost love Daisy Buchanan through the eyes of narrator Nick Carraway. Set in the Jazz Age, it explores themes of wealth, love, and the corruption of idealism.",
          "model": "claude-3-5-sonnet-20241022",
          "usage": {
            "input_tokens": 45,
            "output_tokens": 67
          }
        },
        "headers": {
          "Content-Type": "application/json"
        }
      }
    },
    {
      "condition": "$.prompt contains 'error'",
      "response": {
        "status": 500,
        "body": {
          "error": "Internal server error"
        }
      }
    },
    {
      "default": true,
      "response": {
        "status": 200,
        "body": {
          "content": "This is a compelling book that explores important themes through well-developed characters. The author's writing style is engaging and thought-provoking. Readers will find this work both entertaining and intellectually stimulating.",
          "model": "claude-3-5-sonnet-20241022",
          "usage": {
            "input_tokens": 50,
            "output_tokens": 45
          }
        }
      }
    }
  ]
}
```

### Phase 4: Configuration Updates (30 minutes)

#### 4.1 Update BookStore.Service appsettings.json

```json
{
  "LLM": {
    "Provider": "Claude",
    "UseSimulator": false,
    "SimulatorBaseUrl": "http://localhost:5020",
    "Providers": {
      "Simulator": {
        "Enabled": true,
        "BaseUrl": "http://localhost:5020"
      }
    }
  }
}
```

#### 4.2 Update appsettings.example.json

```json
{
  "LLM": {
    "Provider": "Ollama",
    "UseSimulator": false,
    "SimulatorBaseUrl": "http://localhost:5020",
    "Providers": {
      "Simulator": {
        "Enabled": true,
        "BaseUrl": "http://localhost:5020"
      }
    }
  }
}
```

#### 4.3 Update AppHost appsettings.json

```json
{
  "ApiSimulatorEnabled": false
}
```

### Phase 5: Testing Integration (2-3 hours)

#### 5.1 Create Simulator Test Makefile Targets

**File**: `Makefile` (additions)

```makefile
# API Simulator targets
.PHONY: run-aspire-simulator
run-aspire-simulator: ## Start with API Simulator enabled
 @echo "🎭 Starting BookStore with API Simulator..."
 cd BookStore.Aspire.AppHost && \
 ASPNETCORE_URLS="http://localhost:15888" \
 DOTNET_DASHBOARD_OTLP_HTTP_ENDPOINT_URL="http://localhost:19999" \
 ASPIRE_ALLOW_UNSECURED_TRANSPORT=true \
 ApiSimulatorEnabled=true \
 dotnet run

.PHONY: test-simulator
test-simulator: ## Test API Simulator integration
 @echo "🧪 Testing API Simulator..."
 curl -f http://localhost:28880 && echo "✅ Simulator UI accessible" || echo "❌ Simulator UI failed"
 curl -f http://localhost:17070/health && echo "✅ Simulator API healthy" || echo "❌ Simulator API failed"

.PHONY: perf-simulator
perf-simulator: ## Run performance tests with simulator ($0 cost)
 @echo "🚀 Running K6 tests with API Simulator (FREE)..."
 cd BookStore.Performance.Tests && \
 k6 run tests/books.js \
  --env TEST_TYPE=load \
  --env BASE_URL=http://localhost:7002 \
  --env USE_SIMULATOR=true \
  --out json=results/simulator-test.json
```

#### 5.2 Update K6 Tests for Simulator

**File**: `BookStore.Performance.Tests/config/simulator.js` (new)

```javascript
export const simulatorConfig = {
  useSimulator: __ENV.USE_SIMULATOR === "true",
  simulatorBaseUrl: __ENV.SIMULATOR_BASE_URL || "http://localhost:5020",
};

export function isSimulatorEnabled() {
  return simulatorConfig.useSimulator;
}

// When using simulator, we can increase load significantly since it's free
export function getScaledVUs(baseVUs) {
  return isSimulatorEnabled() ? baseVUs * 10 : baseVUs;
}
```

### Phase 6: Documentation (1 hour)

#### 6.1 Update SETUP.md

Add section:

````markdown
## API Simulator Integration (Zero-Cost Testing)

The API Simulator allows unlimited performance testing without API costs.

### Enable Simulator

```bash
# Set in appsettings.json
"LLM": {
  "UseSimulator": true
}

# Or via environment variable
export LLM__UseSimulator=true

# Start with simulator
make run-aspire-simulator
```
````

### Access Simulator

- **UI Dashboard**: <http://localhost:28880>
- **Internal API**: <http://localhost:17070>
- **Service API**: <http://localhost:5020>

### Cost Comparison

| Provider | Real API      | Simulator |
| -------- | ------------- | --------- |
| Claude   | $0.99/540 req | $0.00     |
| OpenAI   | $0.50-2.00/1K | $0.00     |
| Ollama   | $0.00         | $0.00     |

### When to Use Simulator

✅ **Use Simulator For:**

- CI/CD pipeline tests
- Load testing (unlimited requests)
- Development without API keys
- Testing error scenarios
- Cost-free experimentation

⚠️ **Use Real APIs For:**

- Production deployments
- Accuracy validation
- Real-world performance benchmarks
- Final integration testing

#### 6.2 Create Simulator Guide

**File**: `SIMULATOR.md` (new)

````markdown
# API Simulator Guide

## Overview

The Tricentis API Simulator enables zero-cost LLM performance testing by mocking AI provider responses.

## Quick Start

1. Enable simulator in `appsettings.json`:

```json
{
  "LLM": {
    "UseSimulator": true
  }
}
```

2. Start with simulator:

   ```bash
   make run-aspire-simulator
   ```

3. Verify simulator:

   ```bash
   make test-simulator
   ```

4. Run unlimited tests:

   ```bash
   make perf-simulator
   ```

## Creating Simulations

See `simulations/` directory for examples.

## Monitoring

View simulator activity at: <http://localhost:28880>

### Phase 7: CI/CD Integration (1 hour)

#### 7.1 Update GitHub Actions Workflow

**File**: `.github/workflows/performance.yaml`

```yaml
name: Performance Tests

on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch:
    inputs:
      use_simulator:
        description: "Use API Simulator (zero cost)"
        required: false
        default: "true"
        type: choice
        options:
          - "true"
          - "false"

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "8.0.x"

      - name: Start services with simulator
        run: |
          export LLM__UseSimulator=${{ inputs.use_simulator || 'true' }}
          export ApiSimulatorEnabled=${{ inputs.use_simulator || 'true' }}
          make run-aspire-simulator &
          sleep 30

      - name: Run performance tests
        run: |
          make perf-comprehensive

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: BookStore.Performance.Tests/results/
```

## Implementation Checklist

### Prerequisites

- [ ] Access to Tricentis API Simulator Docker image
- [ ] Understanding of simulator configuration format
- [ ] Simulation JSON definitions ready

### Phase 1: Infrastructure (Day 1)

- [ ] Create `ServiceConstants.cs`
- [ ] Create `ApiSimulatorExtensions.cs`
- [ ] Create `appsettings.simulator.yml`
- [ ] Update `Program.cs` in AppHost
- [ ] Test simulator container starts

### Phase 2: Service Layer (Day 1-2)

- [ ] Create `ILlmProvider` interface
- [ ] Implement `SimulatorLlmService`
- [ ] Update service registration logic
- [ ] Add HTTP client configuration
- [ ] Test provider switching

### Phase 3: Simulations (Day 2)

- [ ] Create simulations directory structure
- [ ] Write Claude simulation JSON
- [ ] Write OpenAI simulation JSON
- [ ] Write error scenario simulations
- [ ] Test simulation responses

### Phase 4: Configuration (Day 2)

- [ ] Update all appsettings files
- [ ] Update example configurations
- [ ] Add environment variable support
- [ ] Test configuration switching

### Phase 5: Testing (Day 3)

- [ ] Add Makefile targets
- [ ] Update K6 test configurations
- [ ] Create simulator-specific tests
- [ ] Run full test suite
- [ ] Validate metrics collection

### Phase 6: Documentation (Day 3)

- [ ] Update SETUP.md
- [ ] Create SIMULATOR.md
- [ ] Update README.md
- [ ] Add troubleshooting guide
- [ ] Create cost comparison table

### Phase 7: CI/CD (Day 3)

- [ ] Update GitHub Actions workflows
- [ ] Add simulator toggle option
- [ ] Test CI/CD pipeline
- [ ] Verify artifact uploads

## Success Metrics

### Technical

- ✅ Simulator starts successfully in Aspire
- ✅ All three simulator ports accessible
- ✅ Service can switch between real/simulator
- ✅ OpenTelemetry metrics work with simulator
- ✅ K6 tests run with simulator at 10x scale

### Business

- ✅ Zero API costs during CI/CD
- ✅ Unlimited performance testing capacity
- ✅ Faster development iteration (no rate limits)
- ✅ Reduced dependency on real API availability

## Risks & Mitigations

| Risk                                      | Mitigation                                                 |
| ----------------------------------------- | ---------------------------------------------------------- |
| Simulator responses don't match real APIs | Create comprehensive simulation library from real API logs |
| Performance characteristics differ        | Document differences, use real APIs for final validation   |
| Team forgets to disable simulator in prod | Add startup checks, environment variable validation        |
| Simulations become outdated               | Regularly update from production API traces                |

## Timeline

- **Day 1**: Infrastructure + Service Layer (4-6 hours)
- **Day 2**: Simulations + Configuration (4-5 hours)
- **Day 3**: Testing + Documentation + CI/CD (4-5 hours)
- **Total**: ~12-16 hours (2-3 days)

## Next Steps After Implementation

1. **Create Simulation Library**: Build comprehensive simulations from production traces
2. **Performance Baseline**: Run comparison tests (simulator vs real APIs)
3. **CI/CD Rollout**: Enable simulator in all pipelines
4. **Team Training**: Document when to use simulator vs real APIs
5. **Monitoring**: Track cost savings and usage patterns

## Questions for Clarification

1. Do we have access to the Tricentis API Simulator Docker image?
2. What format are the simulation definitions (JSON/YAML)?
3. Should we create simulations from hub-services-latest API logs?
4. Do we want to support mixing real and simulated providers?
5. Should simulator be default for development environments?

## References

- hub-services-latest implementation: `Tricentis.AI.Hub.Aspire.AppHost/Extensions/ApiSimulatorExtensions.cs`
- Simulator configuration: `appsettings.simulator.yml`
- Docker image: `ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci:0.2`
````
