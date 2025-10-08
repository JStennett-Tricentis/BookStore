# Contract Tests for API Simulator

This directory contains contract tests that verify the API Simulator mock endpoints behave correctly using the **SimV1 schema format**.

## Test Files

1. **books-api-tests.yaml** - BookStore REST API tests (6 services)
2. **claude-api-tests.yaml** - Claude Messages API tests (2 services)
3. **llm-providers-tests.yaml** - OpenAI, Ollama, and Bedrock tests (5 services)

## Running Contract Tests

### Via API Simulator UI

1. Start the API Simulator with Aspire:

   ```bash
   cd BookStore.Aspire.AppHost && dotnet run
   ```

2. Open the Simulator UI: http://localhost:28880/ui/

3. Navigate to the **Contract Tests** section

4. Select a test file from `BookStore.Simulator/Tests/`

5. Run tests and view results in the UI

## Test Coverage

### Books API Tests (`books-api-tests.yaml`)

- ✅ `test_list_books` - GET /api/v1/Books
- ✅ `test_get_book_by_id` - GET /api/v1/Books/{id}
- ✅ `test_create_book` - POST /api/v1/Books
- ✅ `test_update_book` - PUT /api/v1/Books/{id}
- ✅ `test_delete_book` - DELETE /api/v1/Books/{id}
- ✅ `test_generate_summary` - POST /api/v1/Books/{id}/generate-summary

### Claude API Tests (`claude-api-tests.yaml`)

- ✅ `test_claude_messages_success` - POST /v1/messages (success)
- ✅ `test_claude_messages_rate_limit` - Rate limit error (429)

### LLM Providers Tests (`llm-providers-tests.yaml`)

- ✅ `test_openai_chat_completions` - OpenAI Chat API
- ✅ `test_ollama_generate` - Ollama Generate API
- ✅ `test_ollama_chat` - Ollama Chat API
- ✅ `test_bedrock_invoke` - Bedrock Invoke Model
- ✅ `test_bedrock_invoke_stream` - Bedrock Streaming

**Total: 13 contract test services**

## SimV1 Schema Format

All contract tests **must** follow the SimV1 schema format:

```yaml
schema: SimV1
name: test-suite-name

connections:
  - name: connection-name
    endpoint: http://localhost:port
    listen: false

services:
  - name: test_service_name
    description: Test description
    steps:
      # Step 1: Send request (Out)
      - direction: Out
        name: sendRequest
        to: connection-name
        message:
          method: POST
          headers:
            - key: Content-Type
              value: application/json
          payload: |-
            {
              "field": "value"
            }
        insert:
          - type: Path
            value: /api/endpoint

      # Step 2: Receive and verify response (In)
      - direction: In
        name: receiveResponse
        verify:
          - property: StatusCode
            value: 200 OK
          - jsonPath: field.name
            value: expected-value
          - jsonPath: other.field
            exists: true
```

## Key Format Requirements

### ✅ Correct Format

- `schema: SimV1` at the top
- `direction: Out` with `to: connection-name`
- `insert` array with `type: Path` for URL paths
- `verify` array for validations (NOT `validate`)
- `property: StatusCode` for status codes (NOT `statusCode`)

### ❌ Common Mistakes to Avoid

- Using `uri:` instead of `insert` with `type: Path`
- Using `validate` instead of `verify`
- Using `statusCode:` instead of `property: StatusCode`
- Missing `to:` connection reference on Out steps
- Forgetting `schema: SimV1` at the top

## Verification Rules

| Rule                   | Description           | Example             |
| ---------------------- | --------------------- | ------------------- |
| `property: StatusCode` | Validates HTTP status | `value: 200 OK`     |
| `jsonPath`             | Validates JSON field  | `jsonPath: id`      |
| `exists`               | Checks field exists   | `exists: true`      |
| `value`                | Exact value match     | `value: "expected"` |
| `operator`             | Comparison operator   | `operator: Greater` |

## Port Configuration

Ensure these ports are accessible:

| Service       | Port  | Endpoint                   |
| ------------- | ----- | -------------------------- |
| Claude API    | 17070 | http://localhost:17070     |
| OpenAI API    | 18080 | http://localhost:18080     |
| Ollama API    | 11434 | http://localhost:11434     |
| Bedrock API   | 19090 | http://localhost:19090     |
| BookStore API | 17777 | http://localhost:17777     |
| Simulator UI  | 28880 | http://localhost:28880/ui/ |

## Alternative Testing Methods

### Method 1: curl Commands

Test individual endpoints directly:

```bash
# Claude API test
curl -X POST http://localhost:17070/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 512,
    "messages": [{"role": "user", "content": "test"}]
  }' | jq .

# BookStore API test
curl http://localhost:17777/api/v1/Books | jq .

# OpenAI test
curl -X POST http://localhost:18080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "test"}]
  }' | jq .
```

### Method 2: Automated Test Script

Use the test script in `BookStore.Simulator/Postman/`:

```bash
cd ../Postman
./test-simulator.sh
```

Expected output:

```
🧪 Testing API Simulator Endpoints...

=== Simulator Management ===
Testing Simulator Settings... ✓ PASSED (HTTP 200)

=== BookStore REST API (Port 17777) ===
Testing List Books... ✓ PASSED (HTTP 200)
Testing Get Book by ID... ✓ PASSED (HTTP 200)

=== LLM Provider Mocks ===
Testing Claude Messages... ✓ PASSED (HTTP 200)
Testing OpenAI Chat... ✓ PASSED (HTTP 200)
Testing Ollama Generate... ✓ PASSED (HTTP 200)
Testing Bedrock Invoke... ✓ PASSED (HTTP 200)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Results: 7 passed, 0 failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All tests passed!
```

## Debugging

1. **Check simulator logs** in Aspire Dashboard (http://localhost:15888)
2. **Verify simulations loaded** - Check simulator UI for active simulations
3. **Test endpoints manually** - Use curl or Postman to verify connectivity
4. **Review schema** - Validate against `simulations/iris_schema.json`
5. **Check ports** - Ensure all simulator ports are listening

### Troubleshooting

**Problem**: Tests fail with connection refused
**Solution**: Ensure simulator is running: `curl http://localhost:28880/api/agent/settings`

**Problem**: Validation errors in YAML
**Solution**: Check you're using correct SimV1 format (see `.validation-notes.md`)

**Problem**: Tests time out
**Solution**: Check simulator logs in Aspire Dashboard for errors

## Reference Files

- **Schema Definition**: `BookStore.Simulator/Documentation/API-SIMULATOR-SCHEMA.json`
- **Example Tests**: `/Users/j.stennett/TAIS/hub-service/Tricentis.AI.Hub.EventSimulator/Simulations/contract-tests/`
- **Validation Notes**: `.validation-notes.md`

## Related Documentation

- [API Simulator Summary](../../API-SIMULATOR-SUMMARY.md)
- [Simulation Files](../Definitions/README.md)
- [Postman Tests](../Postman/README.md)
