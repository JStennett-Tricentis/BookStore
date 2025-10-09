# BookStore API Simulations

This directory contains Tricentis API Simulator definitions for mocking LLM providers and BookStore REST APIs.

## Available Simulations

### 1. Claude API Mock (`claude-api.yaml`)

**Internal Port**: 17070
**Services**: 1

- **POST /v1/messages** - Claude Messages API
  - Headers: `anthropic-version: *`
  - Returns: Simulated Claude response with 256 output tokens

**Example Request**:

```bash
curl -X POST http://localhost:17070/v1/messages \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Summarize this book"}]
  }'
```

---

### 2. OpenAI API Mock (`openai-api.yaml`)

**Internal Port**: 18080
**Services**: 1

- **POST /v1/chat/completions** - Chat Completions API
  - Headers: `Authorization: Bearer *`
  - Returns: Simulated GPT-4o response with 300 completion tokens

**Example Request**:

```bash
curl -X POST http://localhost:18080/v1/chat/completions \
  -H "Authorization: Bearer sk-test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Summarize this book"}]
  }'
```

---

### 3. Ollama API Mock (`ollama-api.yaml`)

**Internal Port**: 11434
**Services**: 2

- **POST /api/generate** - Text Generation
  - Model: llama3.2
  - Returns: Simulated response with timing metrics

- **POST /api/chat** - Chat Completions
  - Model: llama3.2
  - Returns: Chat-formatted response

**Example Requests**:

```bash
# Generate
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama3.2", "prompt": "Summarize this book"}'

# Chat
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Summarize this book"}]
  }'
```

---

### 4. AWS Bedrock API Mock (`bedrock-api.yaml`)

**Internal Port**: 19090
**Services**: 2

- **POST /model/\*/invoke** - Invoke Model (non-streaming)
  - Model: us.anthropic.claude-sonnet-4-v1:0
  - Returns: Claude-formatted response via Bedrock

- **POST /model/\*/invoke-with-response-stream** - Streaming Invocation
  - Returns: Simulated streaming response

**Example Request**:

```bash
curl -X POST http://localhost:19090/model/us.anthropic.claude-sonnet-4-v1:0/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Summarize this book"}]
  }'
```

---

### 5. Books REST API Mock (`books-rest-api.yaml`)

**Internal Port**: 17777
**Services**: 6

Full CRUD operations for books:

- **GET /api/v1/Books** - List all books
- **GET /api/v1/Books/{id}** - Get book by ID
- **POST /api/v1/Books** - Create new book (201 Created)
- **PUT /api/v1/Books/{id}** - Update book
- **DELETE /api/v1/Books/{id}** - Delete book (204 No Content)
- **POST /api/v1/Books/{id}/generate-summary** - Generate AI summary

**Example Requests**:

```bash
# List books
curl http://localhost:17777/api/v1/Books

# Get specific book
curl http://localhost:17777/api/v1/Books/68dedb16887eae6ff6743f51

# Create book
curl -X POST http://localhost:17777/api/v1/Books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Book",
    "author": "Author Name",
    "isbn": "978-0-123-45678-9",
    "genre": "Fiction",
    "pageCount": 250
  }'

# Generate summary
curl -X POST http://localhost:17777/api/v1/Books/68dedb16887eae6ff6743f51/generate-summary
```

---

## Simulator Dashboard

Access the Tricentis Simulator UI to view all loaded simulations:

- **UI Dashboard**: <http://localhost:28880/ui/>
- **Settings API**: <http://localhost:28880/api/agent/settings>
- **Simulations API**: <http://localhost:28880/api/simulations>

## Response Features

All simulations include:

✅ **Dynamic Values**:

- `{randomGuid}` - Generates unique IDs
- `{timestamp}` - Current Unix timestamp
- `{Date[{now}][][yyyy-MM-ddTHH:mm:ss.fffZ]}` - ISO 8601 formatted dates

✅ **Realistic Token Counts**:

- Input/output token metrics
- Total token usage
- Model-specific response formats

✅ **Proper Headers**:

- Content-Type
- Request IDs
- Model-specific headers

## File Watching

The simulator automatically reloads when simulation files change:

- Add new `.yaml` files to this directory
- Edit existing simulations
- Changes are detected within 2-3 seconds

## Testing with K6

These simulations can be used with the BookStore K6 performance tests:

```bash
# Test against simulated endpoints
cd BookStore.Performance.Tests
k6 run tests/books.js --env BASE_URL=http://localhost:17777

# Test LLM endpoints
k6 run scenarios/ai-load-test.js --env CLAUDE_URL=http://localhost:17070
```

## Schema Validation

All files follow the **SimV1** schema. See documentation in `../docs/`:

- `01-SCHEMA-BASICS.md` - Basic structure
- `03-SERVICES-STEPS.md` - Service definitions
- `04-MESSAGES.md` - Response payloads
- `05-TRIGGERS.md` - Request matching

## Summary

| Simulation     | Port  | Services | Use Case                |
| -------------- | ----- | -------- | ----------------------- |
| claude-api     | 17070 | 1        | Claude Messages API     |
| openai-api     | 18080 | 1        | OpenAI Chat Completions |
| ollama-api     | 11434 | 2        | Ollama Generate/Chat    |
| bedrock-api    | 19090 | 2        | AWS Bedrock (Claude)    |
| books-rest-api | 17777 | 6        | BookStore CRUD + AI     |

**Total**: 12 services across 5 simulations
