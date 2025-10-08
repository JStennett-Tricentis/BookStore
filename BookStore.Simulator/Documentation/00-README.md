# Tricentis API Simulator - Documentation Guide

SimV1 Schema Reference for BookStore Project

## 📚 Documentation Index

### Getting Started

1. **[QUICK-START.md](./QUICK-START.md)** ⚡ (5 min)
   - Fastest way to create your first simulation
   - Copy-paste examples that work immediately
   - Validates your setup

2. **[01-SCHEMA-BASICS.md](./01-SCHEMA-BASICS.md)** 📖 (10 min)
   - SimV1 schema fundamentals
   - File structure and syntax
   - YAML conventions

### Core Concepts

1. **[02-CONNECTIONS.md](./02-CONNECTIONS.md)** 🔌 (10 min)
   - HTTP endpoints and ports
   - Message brokers (Kafka, RabbitMQ, etc.)
   - Authentication and SSL

2. **[03-SERVICES-STEPS.md](./03-SERVICES-STEPS.md)** 🔄 (15 min)
   - Service definitions
   - Step execution flow (In/Out)
   - Request/response patterns

3. **[04-MESSAGES.md](./04-MESSAGES.md)** 📨 (10 min)
   - Message structure
   - Headers and payloads
   - Status codes and delays

4. **[05-TRIGGERS.md](./05-TRIGGERS.md)** 🎯 (15 min)
   - Request matching conditions
   - JSONPath and XPath
   - Operators and data types

### Advanced Features

1. **[07-RULES-VERIFICATION.md](./07-RULES-VERIFICATION.md)** ✅ (15 min)
   - Verify responses
   - Buffer data capture
   - Insert dynamic values
   - Save to files

2. **[08-RESOURCES-TEMPLATES.md](./08-RESOURCES-TEMPLATES.md)** 🗂️ (10 min)
   - Resource files (CSV, JSON)
   - Reusable templates
   - Data-driven simulations

3. **[09-ADVANCED-FEATURES.md](./09-ADVANCED-FEATURES.md)** 🚀 (15 min)
   - Forward/proxy mode
   - Learning mode (record real APIs)
   - Conditional simulation fallback

### Specialized Topics

1. **[06-OPENAI-LLM.md](./06-OPENAI-LLM.md)** 🤖 (15 min)
   - Claude, OpenAI, Ollama mocks
   - Token counting
   - Streaming responses

2. **[10-TROUBLESHOOTING.md](./10-TROUBLESHOOTING.md)** 🛠️ (10 min)
   - Common errors and fixes
   - Debugging techniques
   - Validation tips

---

## 🎯 Quick Navigation by Task

### "I want to..."

#### Create a simple mock API

→ Start with **[QUICK-START.md](./QUICK-START.md)**

#### Mock an LLM API (Claude, OpenAI, etc.)

→ See **[06-OPENAI-LLM.md](./06-OPENAI-LLM.md)**

#### Match specific request patterns

→ Read **[05-TRIGGERS.md](./05-TRIGGERS.md)**

#### Validate responses from external APIs

→ Check **[07-RULES-VERIFICATION.md](./07-RULES-VERIFICATION.md)** (verify section)

#### Capture and reuse data from requests

→ Check **[07-RULES-VERIFICATION.md](./07-RULES-VERIFICATION.md)** (buffer section)

#### Use CSV/JSON files as data sources

→ See **[08-RESOURCES-TEMPLATES.md](./08-RESOURCES-TEMPLATES.md)**

#### Forward some requests to real APIs

→ Read **[09-ADVANCED-FEATURES.md](./09-ADVANCED-FEATURES.md)** (forward section)

#### Record real API responses

→ Read **[09-ADVANCED-FEATURES.md](./09-ADVANCED-FEATURES.md)** (learning section)

#### Debug failing simulations

→ Check **[10-TROUBLESHOOTING.md](./10-TROUBLESHOOTING.md)**

---

## 📋 Essential Schema Properties

### Top-Level Structure

```yaml
schema: SimV1 # REQUIRED - Must be "SimV1"
name: simulation-name # Optional - Simulation identifier

connections: [] # Define endpoints/listeners
services: [] # Define request/response behavior
resources: [] # Optional - External data files
templates: {} # Optional - Reusable components
includes: [] # Optional - Import other YAML files
```

### Connection (Minimal HTTP)

```yaml
connections:
  - name: my-api
    endpoint: http://localhost:8080
    listen: false # false = outbound, true/port = inbound
```

### Service (Minimal Request/Response)

```yaml
services:
  - name: MyService
    steps:
      - direction: In # Receive request
        trigger:
          - uri: "/api/endpoint"
      - direction: Out # Send response
        message:
          statusCode: 200
          payload: '{"result": "success"}'
```

---

## 🔑 Key Concepts

### Directions

- **`In`** = Receive (incoming request or response from external API)
- **`Out`** = Send (outgoing response or request to external API)

### Step Properties

- **`trigger`** = Match incoming requests (used with `In`)
- **`verify`** = Validate responses (used with `In`)
- **`message`** = Define outgoing content (used with `Out`)
- **`to`** = Target connection for external calls (used with `Out`)
- **`buffer`** = Capture data for later use
- **`insert`** = Inject dynamic values
- **`save`** = Persist data to files

### Rules (trigger, verify, buffer, insert, save)

- **`property`** = Connection/message property (StatusCode, Method, etc.)
- **`jsonPath`** = JSON field path (e.g., `user.email`)
- **`xPath`** = XML field path
- **`type`** = Rule type (Header, Query, Path, etc.)
- **`key`** = Header/query parameter name
- **`value`** = Expected/injected value
- **`operator`** = Comparison (Equal, Greater, Less, etc.)
- **`dataType`** = Value type (String, Numeric, Date)

---

## 🎨 Common Patterns

### Pattern 1: Simple REST API Mock

```yaml
schema: SimV1
name: simple-api

connections:
  - name: api
    port: 8000

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/health"
      - direction: Out
        message:
          statusCode: 200
          payload: '{"status": "ok"}'
```

### Pattern 2: External API Call (Contract Test)

```yaml
schema: SimV1
name: api-test

connections:
  - name: external-api
    endpoint: http://localhost:7002
    listen: false

services:
  - steps:
      - direction: Out
        to: external-api
        message:
          method: GET
        insert:
          - type: Path
            value: /api/v1/Books

      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
          - jsonPath: $[0].id
            exists: true
```

### Pattern 3: Data-Driven Mock

```yaml
schema: SimV1
name: data-driven

resources:
  - name: books
    type: Table
    file: ./data/books.csv
    separator: ","

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/books"
      - direction: Out
        message:
          payload: "{R[books]}" # Load from CSV
```

---

## 🚨 Critical Reminders

### ✅ Always Do

- Set `schema: SimV1` at the top of every file
- Use `direction: In` or `direction: Out` on every step
- Use `to: connection-name` when making external calls with `Out`
- Use `listen: false` for outbound-only connections
- Quote string values in YAML: `value: "text"`
- Specify `dataType: Numeric` for number comparisons
- Use `property: StatusCode` (not `statusCode`)

### ❌ Never Do

- Use `uri:` property (use `insert` with `type: Path`)
- Use `validate` (use `verify`)
- Use `statusCode:` in verify (use `property: StatusCode`)
- Forget `to:` on Out steps calling external APIs
- Skip `schema: SimV1` declaration

---

## 📊 Schema Coverage

| Feature             | Documentation                | Example Simulations          |
| ------------------- | ---------------------------- | ---------------------------- |
| HTTP Endpoints      | ✅ 02-CONNECTIONS.md         | ✅ BookStore, Claude, OpenAI |
| Message Brokers     | ✅ 02-CONNECTIONS.md         | ⚠️ Not in BookStore examples |
| Request Matching    | ✅ 05-TRIGGERS.md            | ✅ All test files            |
| Response Generation | ✅ 04-MESSAGES.md            | ✅ All definition files      |
| Verification        | ✅ 07-RULES-VERIFICATION.md  | ✅ Contract tests            |
| Buffering           | ✅ 07-RULES-VERIFICATION.md  | ❌ Not in examples           |
| Resources           | ✅ 08-RESOURCES-TEMPLATES.md | ❌ Not in examples           |
| Templates           | ✅ 08-RESOURCES-TEMPLATES.md | ❌ Not in examples           |
| Forwarding          | ✅ 09-ADVANCED-FEATURES.md   | ❌ Not in examples           |
| Learning            | ✅ 09-ADVANCED-FEATURES.md   | ❌ Not in examples           |

---

## 🔗 Related Files

- **Schema Definition**: `BookStore.Simulator/Documentation/API-SIMULATOR-SCHEMA.json`
- **Simulation Files**: `BookStore.Simulator/Definitions/*.yaml`
- **Contract Tests**: `BookStore.Simulator/Tests/*.yaml`
- **Postman Tests**: `BookStore.Simulator/Postman/*.json`

---

## 🎓 Learning Path

### Beginner (30 minutes)

1. QUICK-START.md
2. 01-SCHEMA-BASICS.md
3. 02-CONNECTIONS.md
4. 03-SERVICES-STEPS.md

### Intermediate (45 minutes)

1. 04-MESSAGES.md
2. 05-TRIGGERS.md
3. 07-RULES-VERIFICATION.md (verify + buffer)

### Advanced (60 minutes)

1. 06-OPENAI-LLM.md
2. 08-RESOURCES-TEMPLATES.md
3. 09-ADVANCED-FEATURES.md

---

## 📝 Note for Claude Code

When working with Tricentis API Simulator files (SimV1 schema):

1. **Always reference these docs** before modifying `.yaml` files
2. **Validate against `API-SIMULATOR-SCHEMA.json`** schema definition
3. **Check existing examples** in `BookStore.Simulator/Definitions/` and `BookStore.Simulator/Tests/`
4. **Use SimV1 format** - NOT OpenAPI, NOT Postman format
5. **Common mistakes are documented** in each guide's "Common Mistakes" section

### Quick Validation Checklist

- [ ] `schema: SimV1` at top
- [ ] All steps have `direction: In` or `Out`
- [ ] Out steps with external calls have `to: connection-name`
- [ ] Use `verify` (not `validate`)
- [ ] Use `property: StatusCode` (not `statusCode`)
- [ ] Use `insert` array with `type: Path` (not `uri:`)

---

**Total Documentation**: ~2 hours to read comprehensively
**Quick Start**: 5 minutes (QUICK-START.md only)
**Schema Version**: SimV1
**Last Updated**: October 2025
