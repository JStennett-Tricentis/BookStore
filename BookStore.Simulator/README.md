# API Simulator Files

This directory contains all files related to the Tricentis API Simulator for zero-cost LLM performance testing.

## Directory Structure

```yaml
/simulations/
├── /definitions/          # Simulation YAML files (SimV1 schema)
│   ├── claude-api.yaml
│   ├── openai-api.yaml
│   ├── ollama-api.yaml
│   ├── bedrock-api.yaml
│   ├── books-rest-api.yaml
│   └── README.md
│
├── /contract-tests/       # SimV1 contract tests
│   ├── books-api-tests.yaml
│   ├── claude-api-tests.yaml
│   ├── llm-providers-tests.yaml
│   ├── README.md
│   ├── .validation-notes.md
│   └── .contract-tests-fixed.md
│
├── /postman/              # Postman collections for simulator testing
│   ├── BookStore-Simulator-Tests.postman_collection.json
│   ├── BookStore-Simulator.postman_environment.json
│   ├── test-simulator.sh
│   ├── test-data-*.csv
│   └── README.md
│
├── /docs/                 # SimV1 schema documentation
│   ├── 01-SCHEMA-BASICS.md
│   ├── 02-CONNECTIONS.md
│   ├── 03-SERVICES-STEPS.md
│   ├── 04-MESSAGES.md
│   ├── 05-TRIGGERS.md
│   └── 06-OPENAI-LLM.md
│
├── Documentation/
│   ├── API-SIMULATOR-SCHEMA.json  # JSON schema for SimV1 format
├── README.md              # This file
└── STYLE_GUIDE.md         # YAML style guide
```

## Quick Start

### 1. Start the Simulator

```bash
# Start with Aspire (recommended)
cd BookStore.Aspire.AppHost && dotnet run

# Simulator UI available at: http://localhost:28880/ui/
```

### 2. Test the Simulator

```bash
# Option A: Use test script
cd simulations/postman
./test-simulator.sh

# Option B: Use Postman
# Import collections from simulations/postman/

# Option C: Run contract tests
# Open http://localhost:28880/ui/ → Contract Tests section
```

## What's in Each Directory?

### `/definitions/` - Simulation Files

5 YAML files that define mock API endpoints:

- **12 services** across 5 simulations
- Ports: 17070 (Claude), 18080 (OpenAI), 11434 (Ollama), 19090 (Bedrock), 17777 (BookStore)
- Auto-reloaded when files change

### `/contract-tests/` - Validation Tests

13 test services to verify simulator behavior:

- Tests use SimV1 schema format
- Run via Simulator UI
- Validate response structure, status codes, JSON fields

### `/postman/` - Postman Collections

14 requests + automated test script:

- Covers all simulator endpoints
- Includes test data CSVs
- Bash script for CI/CD

### `/docs/` - Documentation

6 comprehensive guides on SimV1 schema:

- Schema basics and structure
- Connection configuration
- Service/step definitions
- Message payloads
- Request triggers
- OpenAI LLM examples

## Key Ports

| Service       | Port  | Purpose               |
| ------------- | ----- | --------------------- |
| Simulator UI  | 28880 | Web dashboard         |
| Claude API    | 17070 | Claude Messages mock  |
| OpenAI API    | 18080 | Chat Completions mock |
| Ollama API    | 11434 | Local LLM mock        |
| Bedrock API   | 19090 | AWS Bedrock mock      |
| BookStore API | 17777 | CRUD + AI summary     |

## Features

✅ **Zero-Cost Testing** - No API charges during load tests
✅ **Realistic Responses** - Token counts, timing, proper formats
✅ **Hot Reload** - Changes detected automatically
✅ **Full OpenTelemetry** - Traces, metrics, logs
✅ **Contract Tests** - Validate simulator behavior
✅ **Postman Integration** - Ready-to-use collections

## Related Documentation

- [API Simulator Summary](../API-SIMULATOR-SUMMARY.md)
- [Project Overview](../CLAUDE.md)
- [Aspire Integration](../BookStore.Aspire.AppHost/Extensions/ApiSimulatorExtensions.cs)
