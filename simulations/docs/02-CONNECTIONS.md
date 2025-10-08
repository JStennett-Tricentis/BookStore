# Tricentis API Simulator - Connections

**Reference**: `/Users/j.stennett/API Simulator/api-simulator-examples/OpenAI/ai-test.yml`

## Overview

Connections define:

1. **Listen ports** - Where the simulator listens for requests
2. **External endpoints** - Real APIs to forward/test against

## Basic Connection Structure

```yaml
schema: SimV1
name: my-simulation

connections:
  - name: myConnection # Connection identifier
    port: 17071 # Listen port (for incoming requests)

services:
  - steps:
      - direction: In
      - direction: Out
```

## Connection Properties

| Property        | Type    | Required       | Description                       |
| --------------- | ------- | -------------- | --------------------------------- |
| `name`          | String  | ✅ Yes         | Unique connection identifier      |
| `port`          | Integer | ⚠️ Conditional | Port to listen on (for incoming)  |
| `endpoint`      | String  | ⚠️ Conditional | External API URL (for outgoing)   |
| `capture`       | Boolean | ❌ No          | Capture traffic for learning mode |
| `create`        | Boolean | ❌ No          | Auto-create connection            |
| `listen`        | Boolean | ❌ No          | Enable listening mode             |
| `keepProcessed` | Boolean | ❌ No          | Keep processed messages           |

## Listen Port Configuration

Use when the simulator should **accept incoming requests**:

```yaml
connections:
  - name: api-listener
    port: 13373 # Simulator listens on http://localhost:13373
```

**Example Usage**:

```bash
curl http://localhost:13373/api/endpoint
```

## External Endpoint Configuration

Use when the simulator should **forward to or test a real API**:

```yaml
connections:
  - name: openai-api
    capture: false
    create: false
    endpoint: https://api.openai.com/v1/chat/completions
    keepProcessed: false
    listen: false
```

### Using External Connections in Steps

```yaml
services:
  - name: TestRealAPI
    steps:
      - direction: Out
        to: openai-api # References connection name
        message:
          method: POST
          headers:
            - key: Authorization
              value: Bearer sk-...
          payload: |
            {"model": "gpt-4", "messages": []}

      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
```

## Multiple Connections

You can define multiple connections for different purposes:

```yaml
connections:
  - name: simulator-port
    port: 17071 # Listen for client requests

  - name: real-claude-api
    endpoint: https://api.anthropic.com/v1/messages

  - name: real-openai-api
    endpoint: https://api.openai.com/v1/chat/completions

services:
  - name: ProxyToClaude
    steps:
      - direction: In # Receive from client
        trigger:
          - uri: "/claude/*"
      - direction: Out # Forward to real Claude
        to: real-claude-api
```

## Learning Mode Configuration

Capture real API traffic for creating simulations:

```yaml
connections:
  - name: learning-proxy
    port: 14444
    capture: true # Enable traffic capture
    endpoint: https://api.openai.com/v1/chat/completions
    keepProcessed: true # Keep captured data
```

**Usage**:

```bash
# Requests through port 14444 will be captured and forwarded
curl http://localhost:14444/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -d '{"model": "gpt-4", "messages": []}'
```

## Common Patterns

### 1. Pure Simulation (No External API)

```yaml
connections:
  - name: mock-api
    port: 17071

services:
  - steps:
      - direction: In
        trigger:
          - uri: "*"
      - direction: Out
        message:
          payload: Simulated response
```

### 2. Forward-First (Try Real API, Then Simulate)

```yaml
connections:
  - name: hybrid
    port: 17071
    endpoint: https://api.real-service.com
    simulateFirst: false # Try real API first
```

### 3. Simulate-First (Try Simulation, Then Real API)

```yaml
connections:
  - name: hybrid
    port: 17071
    endpoint: https://api.real-service.com
    simulateFirst: true # Try simulation first
```

## Common Mistakes

### ❌ Missing connection name

```yaml
connections:
  - port: 17071 # ❌ Missing name
```

### ❌ Invalid port number

```yaml
connections:
  - name: api
    port: "17071" # ❌ Should be integer, not string
```

### ❌ Duplicate connection names

```yaml
connections:
  - name: api
    port: 17071
  - name: api # ❌ Duplicate name
    port: 17072
```

## Next Steps

- [Services and Steps](./03-SERVICES-STEPS.md) - Define service logic
- [Messages](./04-MESSAGES.md) - Structure requests and responses
- [OpenAI/LLM Patterns](./06-OPENAI-LLM.md) - AI API examples
