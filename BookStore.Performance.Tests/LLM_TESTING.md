# LLM Performance Testing Guide

This guide covers performance testing for AI-powered features in the BookStore API, specifically the Claude-powered book summary generation endpoint.

## Overview

The BookStore API now includes an AI-powered endpoint that generates book summaries using Claude 3.5 Sonnet:

```text
POST /api/v1/Books/{bookId}/generate-summary
```

This endpoint has different performance characteristics than traditional CRUD operations:

- **Higher latency**: 1-10 seconds typical (vs <100ms for CRUD)
- **Rate limits**: External API constraints
- **Cost per request**: Token-based pricing
- **Variable response times**: Based on prompt complexity

## Test Scenarios

### 1. AI-Only Tests (`tests/ai-summary.js`)

Pure LLM endpoint testing with different load patterns:

#### **Smoke Test** (`perf-ai-smoke`)

- **Duration**: 3 minutes
- **Load**: 1-2 concurrent users
- **Purpose**: Quick validation that AI endpoint works
- **Run**: `make perf-ai-smoke`

#### **Load Test** (`perf-ai-load`)

- **Duration**: 12 minutes
- **Load**: 3-5 concurrent users
- **Purpose**: Sustained AI workload testing
- **Run**: `make perf-ai-load`

#### **Stress Test** (`perf-ai-stress`)

- **Duration**: 17 minutes
- **Load**: 5-15 concurrent users
- **Purpose**: Find breaking points for AI operations
- **Run**: `make perf-ai-stress`

#### **Spike Test** (`perf-ai-spike`)

- **Duration**: 8 minutes
- **Load**: 2 → 20 → 2 users
- **Purpose**: Test sudden traffic surges
- **Run**: `make perf-ai-spike`

### 2. Mixed Workload Tests (`scenarios/mixed-workload.js`)

Realistic production traffic combining CRUD and AI operations:

#### **Mixed Workload** (`perf-mixed`)

- **LLM Traffic**: 20% (configurable)
- **AI-Enabled Users**: 30%
- **Duration**: 23 minutes
- **Load**: Ramps to 15 users
- **Purpose**: Realistic production simulation
- **Run**: `make perf-mixed`

#### **Heavy AI Workload** (`perf-mixed-heavy`)

- **LLM Traffic**: 50% (configurable)
- **AI-Enabled Users**: 60%
- **Duration**: 23 minutes
- **Purpose**: AI-heavy usage patterns
- **Run**: `make perf-mixed-heavy`

### 3. Comprehensive Test Suite

Run all AI tests sequentially:

```bash
make perf-ai-all  # ~40 minutes
```

## Custom Test Parameters

You can customize tests using environment variables:

```bash
# Adjust LLM traffic percentage (default: 20%)
cd BookStore.Performance.Tests
k6 run scenarios/mixed-workload.js \
  --env BASE_URL=http://localhost:7002 \
  --env LLM_PERCENTAGE=35 \
  --env AI_USERS=50

# Run specific AI test scenario
k6 run tests/ai-summary.js \
  --env SCENARIO=llm_load \
  --env BASE_URL=http://localhost:7002
```

## Performance Thresholds

### CRUD Operations

- P95 latency: < 1 second
- P99 latency: < 2 seconds
- Error rate: < 1%

### LLM Operations

- P95 latency: < 8 seconds
- P99 latency: < 12 seconds
- Error rate: < 5%

### Mixed Workload

- Overall P95: < 5 seconds
- Overall P99: < 10 seconds
- Overall error rate: < 2%

## Metrics Collected

### LLM-Specific Metrics

- `llm_errors` - Rate of failed LLM requests
- `llm_response_time` - Trend of LLM operation latency
- `llm_operations` - Counter of completed LLM operations
- `llm_concurrent_requests` - Gauge of concurrent LLM requests

### Mixed Workload Metrics

- `crud_errors` / `llm_errors` - Separate error tracking
- `crud_response_time` / `llm_response_time` - Separate latency tracking
- `crud_operations` / `llm_operations` - Operation counts
- `total_operations` - Overall operation counter

## Grafana Dashboard

The BookStore Performance dashboard includes dedicated LLM panels:

### LLM Overview (Top Row)

- LLM Requests per Second
- LLM P95 Latency
- LLM Error Rate
- Total LLM Requests (5m)

### LLM Analysis (Middle Rows)

- LLM Endpoint Latency Percentiles (P50/P95/P99)
- LLM vs Non-LLM Traffic comparison
- LLM Request Status Codes (2xx/5xx)
- LLM Token Usage (requires custom metrics)

Access at: <http://localhost:3000/d/bookstore-perf>

## Monitoring LLM Operations

### OpenTelemetry Traces

All LLM operations are fully instrumented with semantic conventions:

```csharp
// Trace tags included:
- llm.request.type = "chat"
- llm.system = "anthropic"
- llm.model.name = "claude-3-5-sonnet-20241022"
- gen_ai.request.max_tokens = 500
- gen_ai.usage.input_tokens = 45
- gen_ai.usage.output_tokens = 123
- llm.latency = 2456.78
```

View traces in:

- **Traceloop**: <https://app.traceloop.com> (configured)
- **Aspire Dashboard**: <http://localhost:15888>
- **Grafana**: <http://localhost:3000>

### Prometheus Metrics

HTTP-level metrics available via OpenTelemetry:

```promql
# LLM request rate
sum(rate(http_server_request_duration_seconds_count{http_route=~".*generate-summary.*"}[1m]))

# LLM P95 latency
histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket{http_route=~".*generate-summary.*"}[1m])) by (le))

# LLM error rate
sum(rate(http_server_request_duration_seconds_count{http_route=~".*generate-summary.*",http_response_status_code=~"5.."}[1m]))
  / sum(rate(http_server_request_duration_seconds_count{http_route=~".*generate-summary.*"}[1m]))
```

## Best Practices

### 1. Start Small

Always begin with smoke tests to validate functionality before running load tests.

### 2. Monitor Costs

LLM operations have per-request costs. Monitor token usage:

- Input tokens: ~40-60 per request (book metadata)
- Output tokens: ~80-150 per request (summary)
- Cost: ~$0.003-0.005 per request (Claude Sonnet 3.5)

### 3. Realistic Traffic Patterns

Use mixed workload tests (20-30% LLM traffic) for production-like scenarios.

### 4. Rate Limiting

Claude API has rate limits. For high-load tests:

- Consider rate limiting in your application
- Use exponential backoff for retries
- Monitor 429 (Too Many Requests) responses

### 5. Cache Summaries

Consider caching generated summaries in Redis to reduce costs and improve performance.

## Troubleshooting

### Slow LLM Responses

- Check network connectivity to Anthropic API
- Verify API key is valid
- Check Traceloop for detailed trace data
- Review Claude API status page

### High Error Rates

- Check API key expiration
- Verify rate limits not exceeded
- Review error logs in Aspire Dashboard
- Check for MongoDB issues (book retrieval)

### Test Failures

```bash
# Verify services are healthy
make health-check

# Check if books exist for testing
curl http://localhost:7002/api/v1/Books?page=1&pageSize=10

# Test AI endpoint manually
curl -X POST http://localhost:7002/api/v1/Books/{bookId}/generate-summary
```

## Integration with hub-services-latest

These tests and dashboards are designed to be portable to hub-services-latest:

1. **OpenTelemetry Semantic Conventions**: Using standard `gen_ai.*` and `llm.*` tags
2. **Grafana Dashboard**: All queries use portable PromQL
3. **K6 Tests**: Generic structure works with any LLM provider
4. **Traceloop Integration**: Already configured and compatible

To migrate:

1. Copy `tests/ai-summary.js` and `scenarios/mixed-workload.js`
2. Update `BASE_URL` to hub-services endpoint
3. Adjust operation names in `getOperationsForUser()`
4. Import Grafana dashboard JSON
5. Update Makefile with new commands

## Example Test Run

```bash
# Terminal 1: Start services
make run-aspire

# Terminal 2: Wait for services to be ready
make health-wait

# Terminal 3: Run AI smoke test
make perf-ai-smoke

# Monitor in real-time:
# - Grafana: http://localhost:3000
# - Aspire Dashboard: http://localhost:15888
# - Traceloop: https://app.traceloop.com
```

## Future Enhancements

Consider adding:

1. **Custom Token Metrics**: Export actual token counts from ClaudeService

    ```csharp
    _meter.CreateCounter<long>("claude.tokens.input").Add(inputTokens);
    _meter.CreateCounter<long>("claude.tokens.output").Add(outputTokens);
    ```

2. **Cost Tracking**: Calculate and export costs in real-time

    ```csharp
    var cost = (inputTokens * 0.000003) + (outputTokens * 0.000015);
    _meter.CreateHistogram<double>("claude.cost.dollars").Record(cost);
    ```

3. **Quality Metrics**: Track summary length, stop reasons, model versions

4. **A/B Testing**: Compare different models or prompts under load

5. **Caching Effectiveness**: Measure cache hit rates for summaries

## Support

For issues or questions:

- Check CLAUDE.md for project overview
- Review Makefile for all available commands
- Check Grafana dashboards for metrics
- Review Traceloop for detailed traces
