# Tricentis API Simulator - Quick Start Guide

Get your first simulation running in 5 minutes.

## ⚡ 1-Minute Overview

The Tricentis API Simulator mocks HTTP APIs using YAML configuration files. You define:

1. **Connections** - Where to listen or send requests
2. **Services** - Request matching and response logic
3. **Steps** - Sequence of In/Out operations

## 🚀 Your First Simulation (Copy & Paste)

### Step 1: Create a Simple Mock API

Create `BookStore.Simulator/Definitions/hello-world.yaml`:

```yaml
schema: SimV1
name: hello-world

connections:
  - name: hello-server
    port: 19999
    listen: true

services:
  - name: SayHello
    description: Returns a simple greeting
    steps:
      - direction: In
        trigger:
          - uri: "/hello"
          - method: "GET"

      - direction: Out
        message:
          statusCode: 200
          headers:
            - key: Content-Type
              value: application/json
          payload: |-
            {
              "message": "Hello from API Simulator!",
              "timestamp": "{timestamp}"
            }
```

### Step 2: Start the Simulator

```bash
cd BookStore.Aspire.AppHost && dotnet run
```

The simulator will:

- Load all YAML files from `BookStore.Simulator/Definitions/`
- Start listening on port 19999
- Be accessible at Simulator UI: <http://localhost:28880/ui/>

### Step 3: Test Your API

```bash
curl http://localhost:19999/hello
```

**Expected Output:**

```json
{
  "message": "Hello from API Simulator!",
  "timestamp": "2025-10-08T16:30:45Z"
}
```

---

## 📋 Core Concepts

### 1. Schema Declaration

**Every file must start with:**

```yaml
schema: SimV1
name: your-simulation-name
```

### 2. Connections

```yaml
connections:
  - name: my-server
    port: 8000 # Listen on port 8000
    listen: true # Accept incoming connections
```

or

```yaml
connections:
  - name: external-api
    endpoint: http://api.example.com
    listen: false # Outbound only
```

### 3. Services

Services contain **steps** that execute in order:

```yaml
services:
  - name: MyService
    steps:
      - direction: In # Step 1: Receive request
        trigger:
          - uri: "/api/endpoint"

      - direction: Out # Step 2: Send response
        message:
          statusCode: 200
          payload: '{"result": "success"}'
```

### 4. Directions

- **`In`** = Receive (incoming request or external API response)
- **`Out`** = Send (outgoing response or external API request)

---

## 🎯 Common Use Cases

### Use Case 1: REST API Mock

```yaml
schema: SimV1
name: book-api-mock

connections:
  - name: book-service
    port: 17777

services:
  # GET /api/v1/Books
  - name: ListBooks
    steps:
      - direction: In
        trigger:
          - uri: "/api/v1/Books"
          - method: "GET"
      - direction: Out
        message:
          statusCode: 200
          payload: |-
            [
              {"id": "1", "title": "Book One"},
              {"id": "2", "title": "Book Two"}
            ]

  # GET /api/v1/Books/{id}
  - name: GetBook
    steps:
      - direction: In
        trigger:
          - uri: "/api/v1/Books/*"
          - method: "GET"
      - direction: Out
        message:
          statusCode: 200
          payload: '{"id": "123", "title": "Specific Book"}'

  # POST /api/v1/Books
  - name: CreateBook
    steps:
      - direction: In
        trigger:
          - uri: "/api/v1/Books"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 201
          headers:
            - key: Location
              value: "/api/v1/Books/{randomGuid}"
          payload: '{"id": "{randomGuid}", "title": "New Book"}'
```

**Test it:**

```bash
curl http://localhost:17777/api/v1/Books
curl http://localhost:17777/api/v1/Books/123
curl -X POST http://localhost:17777/api/v1/Books \
  -H "Content-Type: application/json" \
  -d '{"title": "My Book"}'
```

### Use Case 2: LLM API Mock (Claude)

```yaml
schema: SimV1
name: claude-api-mock

connections:
  - name: claude-api
    port: 17070

services:
  - name: ClaudeMessages
    steps:
      - direction: In
        trigger:
          - uri: "/v1/messages"
          - method: "POST"
          - header:
              name: "anthropic-version"
              value: "*"

      - direction: Out
        message:
          statusCode: 200
          delay: 1500
          headers:
            - key: Content-Type
              value: application/json
          payload: |-
            {
              "id": "msg_{randomGuid}",
              "type": "message",
              "role": "assistant",
              "content": [
                {
                  "type": "text",
                  "text": "This is a simulated response from Claude API."
                }
              ],
              "model": "claude-3-5-sonnet-20241022",
              "usage": {
                "input_tokens": 25,
                "output_tokens": 50
              }
            }
```

**Test it:**

```bash
curl -X POST http://localhost:17070/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Use Case 3: Contract Test (Call Real API)

```yaml
schema: SimV1
name: api-contract-test

connections:
  - name: real-api
    endpoint: http://localhost:7002
    listen: false

services:
  - name: TestGetBooks
    description: Verify real API returns books list
    steps:
      # Step 1: Send request
      - direction: Out
        to: real-api
        message:
          method: GET
        insert:
          - type: Path
            value: /api/v1/Books

      # Step 2: Verify response
      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
          - jsonPath: $[0].id
            exists: true
          - jsonPath: $[0].title
            exists: true
```

**Run via Simulator UI:**

1. Open <http://localhost:28880/ui/>
2. Navigate to **Contract Tests**
3. Select `api-contract-test.yaml`
4. Click **Run**

---

## 🔑 Dynamic Values

Use placeholders for dynamic content:

```yaml
payload: |-
  {
    "id": "{randomGuid}",
    "timestamp": "{timestamp}",
    "random_number": "{random[1][100]}"
  }
```

**Available placeholders:**

- `{randomGuid}` - UUID
- `{timestamp}` - Current ISO timestamp
- `{random[min][max]}` - Random number
- `{B[bufferName]}` - Buffered value (see advanced docs)

---

## ✅ Validation Checklist

Before running your simulation:

- [ ] First line is `schema: SimV1`
- [ ] All connections have `name` property
- [ ] All services have `steps` array
- [ ] All steps have `direction: In` or `Out`
- [ ] `In` steps have `trigger` or `verify`
- [ ] `Out` steps have `message`
- [ ] External API calls use `to: connection-name`
- [ ] Ports don't conflict with other services

---

## 🐛 Common Mistakes

### ❌ Missing Schema Declaration

```yaml
name: my-simulation # ❌ Missing schema!
```

✅ Fix:

```yaml
schema: SimV1
name: my-simulation
```

### ❌ Missing Direction

```yaml
steps:
  - trigger: # ❌ No direction!
      - uri: "/test"
```

✅ Fix:

```yaml
steps:
  - direction: In
    trigger:
      - uri: "/test"
```

### ❌ External Call Missing 'to'

```yaml
steps:
  - direction: Out
    message:
      method: GET # ❌ Where to send this?
```

✅ Fix:

```yaml
steps:
  - direction: Out
    to: external-api
    message:
      method: GET
```

### ❌ Using `uri:` Property

```yaml
steps:
  - direction: Out
    to: api
    message:
      method: GET
      uri: /api/endpoint # ❌ Wrong!
```

✅ Fix:

```yaml
steps:
  - direction: Out
    to: api
    message:
      method: GET
    insert:
      - type: Path
        value: /api/endpoint
```

---

## 🎓 Next Steps

### Learn More

- **[01-SCHEMA-BASICS.md](./01-SCHEMA-BASICS.md)** - YAML syntax and structure
- **[02-CONNECTIONS.md](./02-CONNECTIONS.md)** - Connection types and config
- **[03-SERVICES-STEPS.md](./03-SERVICES-STEPS.md)** - Service patterns
- **[05-TRIGGERS.md](./05-TRIGGERS.md)** - Advanced request matching

### See Examples

- **BookStore.Simulator/Definitions/** - 5 working simulation files
- **BookStore.Simulator/Tests/** - 13 contract test examples

### Test Your Simulations

```bash
# Start simulator
cd BookStore.Aspire.AppHost && dotnet run

# Run Postman tests
cd BookStore.Simulator/Postman
./test-simulator.sh

# Use Simulator UI
open http://localhost:28880/ui/
```

---

## 📞 Get Help

- **Troubleshooting**: [10-TROUBLESHOOTING.md](./10-TROUBLESHOOTING.md)
- **All Docs**: [00-README.md](./00-README.md)
- **Schema Reference**: `BookStore.Simulator/Documentation/API-SIMULATOR-SCHEMA.json`
