# API Simulator - Postman Collection

## Files

- **API-Simulator-Tests.postman_collection.json** - Complete collection with 14 requests
- **API-Simulator.postman_environment.json** - Environment variables
- **test-simulator.sh** - Automated test script

## Quick Start

### Import into Postman

1. Open Postman Desktop
2. Click **Import**
3. Select both files:
   - `API-Simulator-Tests.postman_collection.json`
   - `API-Simulator.postman_environment.json`
4. Select "API Simulator - Local" environment from dropdown
5. Start testing!

### Run with Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run all tests
newman run API-Simulator-Tests.postman_collection.json \
  -e API-Simulator.postman_environment.json

# Run with HTML report
newman run API-Simulator-Tests.postman_collection.json \
  -e API-Simulator.postman_environment.json \
  -r htmlextra \
  --reporter-htmlextra-export ./results/report.html
```

### Run Quick Test Script

```bash
./test-simulator.sh
```

## Collection Structure

### Simulator Management (2 requests)
- Get Simulator Settings
- Access UI Dashboard

### Claude API Mock - Port 17070 (1 request)
- POST /v1/messages

### OpenAI API Mock - Port 18080 (1 request)
- POST /v1/chat/completions

### Ollama API Mock - Port 11434 (2 requests)
- POST /api/generate
- POST /api/chat

### AWS Bedrock Mock - Port 19090 (2 requests)
- POST /model/*/invoke
- POST /model/*/invoke-with-response-stream

### BookStore REST API Mock - Port 17777 (6 requests)
- GET /api/v1/Books
- GET /api/v1/Books/{id}
- POST /api/v1/Books
- PUT /api/v1/Books/{id}
- DELETE /api/v1/Books/{id}
- POST /api/v1/Books/{id}/generate-summary

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| simulator_ui | http://localhost:28880 | Simulator UI |
| claude_port | 17070 | Claude mock port |
| openai_port | 18080 | OpenAI mock port |
| ollama_port | 11434 | Ollama mock port |
| bedrock_port | 19090 | Bedrock mock port |
| books_api_port | 17777 | Books API port |
| book_id | 68dedb16887eae6ff6743f51 | Test book ID |

## Related Documentation

- [API Simulator Summary](../../API-SIMULATOR-SUMMARY.md)
- [Simulation Files](../../simulations/Books/README.md)
- [Contract Tests](../../simulations/tests/README.md)
