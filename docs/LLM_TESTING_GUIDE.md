# LLM Testing Guide

This guide explains how to test the multi-provider LLM functionality in the BookStore API.

## Available Providers

The API now supports **4 LLM providers**:

1. **Ollama** (Default) - Free local LLM, no API key required
2. **Claude** - Anthropic's Claude via API
3. **OpenAI** - ChatGPT (GPT-4o-mini)
4. **Bedrock** - AWS Bedrock with Claude

## Quick Start with Postman

### Import the Collection

The Postman collection is located at: `BookStore.postman_collection.json`

Import it into Postman to access pre-configured requests.

### New Endpoints

#### 1. Get Available Providers

```
GET http://localhost:7002/api/v1/Books/llm-providers
```

**Response:**

```json
{
    "availableProviders": ["claude", "openai", "bedrock", "ollama"],
    "defaultProvider": "ollama"
}
```

#### 2. Generate Summary (Default Provider)

```
POST http://localhost:7002/api/v1/Books/{bookId}/generate-summary
```

Uses the default provider configured in `appsettings.json` (Ollama).

#### 3. Generate Summary (Specific Provider)

```
POST http://localhost:7002/api/v1/Books/{bookId}/generate-summary?provider=ollama
POST http://localhost:7002/api/v1/Books/{bookId}/generate-summary?provider=claude
POST http://localhost:7002/api/v1/Books/{bookId}/generate-summary?provider=openai
POST http://localhost:7002/api/v1/Books/{bookId}/generate-summary?provider=bedrock
```

**Response:**

```json
{
    "bookId": "670c27a74f0e6b7a2e1a3456",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "provider": "ollama",
    "aiGeneratedSummary": "A captivating tale of wealth..."
}
```

## Postman Collection Structure

### LLM Testing Folder

The collection includes a dedicated **LLM Testing** folder with:

1. **Get LLM Providers** - Lists all available providers
2. **Test AI Summary - Default Provider** - Uses configured default
3. **Test AI Summary - Ollama** - Free local LLM (always works)
4. **Test AI Summary - Claude** - Requires API key
5. **Test AI Summary - OpenAI** - Requires API key
6. **Test AI Summary - Bedrock** - Requires AWS credentials
7. **Test Invalid Provider** - Error handling test
8. **Verify Ollama Metrics** - Check Prometheus metrics
9. **Verify Claude Metrics** - Check cost tracking

### Test Assertions

Each request includes automated tests:

- ✅ Status code validation (200 for success, 503 for unconfigured)
- ✅ Provider name verification
- ✅ Summary content validation
- ✅ Response time checks
- ✅ Error message validation

## Configuration

### appsettings.json

```json
{
    "LLM": {
        "Provider": "Ollama" // Default provider
    },
    "Claude": {
        "ApiKey": "" // Add your API key here
    },
    "OpenAI": {
        "ApiKey": "",
        "Model": "gpt-4o-mini"
    },
    "Bedrock": {
        "Region": "us-east-1",
        "Model": "anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    "Ollama": {
        "BaseUrl": "http://localhost:11434",
        "Model": "llama3.2:latest"
    }
}
```

## Testing Ollama (Recommended for Performance Testing)

### Why Ollama?

- ✅ **FREE** - No API costs
- ✅ **Fast** - Local inference
- ✅ **Unlimited** - No rate limits
- ✅ **Privacy** - Data stays local

### Prerequisites

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3.2`
3. Verify it's running: `ollama list`

### Test Ollama with Postman

1. Open the collection
2. Navigate to: **LLM Testing → Test AI Summary - Ollama**
3. Click **Send**

Expected result:

```json
{
    "bookId": "...",
    "title": "...",
    "author": "...",
    "provider": "ollama",
    "aiGeneratedSummary": "..."
}
```

### Verify Metrics

After generating summaries, check Prometheus metrics:

```
GET http://localhost:7002/metrics
```

Look for:

```
# Ollama token counts
ollama_tokens_input_tokens{model="llama3.2"} 45
ollama_tokens_output_tokens{model="llama3.2"} 67
ollama_tokens_total_tokens{model="llama3.2"} 112

# Ollama cost (always $0)
ollama_cost_usd_USD{model="llama3.2"} 0
```

## Error Handling

### Provider Not Configured

If you try to use a provider without configuration:

**Request:**

```
POST /api/v1/Books/{id}/generate-summary?provider=claude
```

**Response (503):**

```json
{
    "message": "LLM provider not configured: Claude API key not configured"
}
```

### Invalid Provider

**Request:**

```
POST /api/v1/Books/{id}/generate-summary?provider=invalid
```

**Response (400):**

```json
{
    "message": "Unknown provider: invalid. Available providers: claude, openai, bedrock, ollama"
}
```

## Performance Testing with Ollama

### Run Collection with Newman

```bash
make test-smoke
```

This runs the Postman collection including all LLM tests.

### K6 Performance Tests

The LLM endpoints can be stress-tested with K6:

```bash
cd BookStore.Performance.Tests
k6 run tests/books.js --env TEST_TYPE=load
```

## Monitoring & Observability

### Grafana Dashboard

View real-time metrics:

```
http://localhost:3000
```

**LLM Metrics Include:**

- Token usage (input/output/total)
- Cost per request (USD)
- Latency (milliseconds)
- Provider distribution

### Aspire Dashboard

View traces and logs:

```
http://localhost:15888
```

**LLM Traces Include:**

- Request/response content
- Token counts
- Cost calculation
- Error details

## Troubleshooting

### Ollama Not Running

**Error:** Connection refused to http://localhost:11434

**Solution:**

```bash
ollama serve
```

### Model Not Downloaded

**Error:** Model "llama3.2" not found

**Solution:**

```bash
ollama pull llama3.2
```

### API Key Issues

**Error:** Provider not configured

**Solution:** Add API keys to `appsettings.json`:

```json
{
    "Claude": {
        "ApiKey": "sk-ant-..."
    },
    "OpenAI": {
        "ApiKey": "sk-..."
    }
}
```

### AWS Credentials (Bedrock)

**Error:** AWS credentials not found

**Solution:** Configure AWS CLI:

```bash
aws configure
```

## Next Steps

After validating the LLM endpoints in Postman:

1. ✅ Create .NET integration tests for Ollama
2. ✅ Add K6 performance tests for LLM endpoints
3. ✅ Measure throughput and latency
4. ✅ Compare provider performance
5. ✅ Validate cost tracking accuracy

## Summary

You now have a **fully functional multi-provider LLM system** ready for testing:

- **4 providers** (Ollama, Claude, OpenAI, Bedrock)
- **Postman collection** with pre-built tests
- **Metrics & tracing** via Prometheus and Aspire
- **Cost tracking** for paid providers
- **Error handling** for invalid configurations

🚀 **Start testing with Ollama** - it's free, fast, and perfect for performance validation!
