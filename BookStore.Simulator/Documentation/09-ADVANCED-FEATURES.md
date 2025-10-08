# Tricentis API Simulator - Advanced Features

**Forwarding, learning mode, and conditional simulation**

## Overview

Advanced connection features:
- **Forward** - Proxy requests to real APIs
- **Learning Mode** - Record real API responses automatically
- **SimulateOn** - Conditional fallback to simulation

---

## Forward Mode (Proxy)

Forward mode allows the simulator to act as a proxy, passing requests through to a real API.

### Basic Forward Configuration

```yaml
connections:
  - name: proxy-connection
    port: 18000
    listen: true
    forward:
      mode: PassThrough
      to: real-api

  - name: real-api
    endpoint: https://api.example.com
    listen: false

services:
  - steps:
      - direction: In
      - direction: Out
```

### Forward Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `PassThrough` | Forward all requests to real API | Pure proxy |
| `ForwardFirst` | Try real API first, fallback to simulation on error | Hybrid mode |
| `SimulateFirst` | Try simulation first, fallback to real API | Test-first approach |
| `Learning` | Record real API responses for future simulation | Build simulation library |

### PassThrough Mode

Forward all requests directly to real API:

```yaml
connections:
  - name: proxy
    port: 17000
    forward:
      mode: PassThrough
      to: real-claude-api

  - name: real-claude-api
    endpoint: https://api.anthropic.com
    listen: false
    headers:
      - key: x-api-key
        value: ${ANTHROPIC_API_KEY}

# No services needed - pure proxy
```

**Usage:**
```bash
# Call simulator port, it forwards to real API
curl -X POST http://localhost:17000/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-5-sonnet-20241022", "messages": [...]}'
```

### ForwardFirst Mode

Try real API first, use simulation if real API fails:

```yaml
connections:
  - name: resilient-proxy
    port: 18000
    forward:
      mode: ForwardFirst
      to: real-api
      simulateOn:
        # Fallback to simulation if real API returns 5xx
        statusCodes: "5xx"
        # Or if real API times out (ms)
        timeout: 5000

  - name: real-api
    endpoint: https://api.example.com
    listen: false

services:
  - name: FallbackResponse
    description: Used when real API fails
    steps:
      - direction: In
        trigger:
          - uri: "*"
      - direction: Out
        message:
          statusCode: 200
          payload: '{"source": "simulation", "reason": "real API unavailable"}'
```

**Behavior:**
- Real API healthy → Returns real response
- Real API returns 500 → Returns simulated response
- Real API timeout → Returns simulated response

### SimulateFirst Mode

Try simulation first, forward to real API if simulation doesn't match:

```yaml
connections:
  - name: test-first-proxy
    port: 19000
    forward:
      mode: SimulateFirst
      to: real-api

  - name: real-api
    endpoint: https://api.example.com
    listen: false

services:
  - name: MockedEndpoint
    description: This endpoint is simulated
    steps:
      - direction: In
        trigger:
          - uri: "/mocked/endpoint"
      - direction: Out
        message:
          payload: '{"source": "simulation"}'

  # Any other endpoint → forwarded to real API
```

**Behavior:**
- Request matches simulation trigger → Use simulation
- Request doesn't match → Forward to real API

---

## Learning Mode

Record real API responses to build simulation libraries automatically.

### Basic Learning Configuration

```yaml
connections:
  - name: learning-proxy
    port: 20000
    forward:
      mode: Learning
      to: real-api
      learning:
        pathTemplate: ./recordings/{timestamp}_{method}_{path}.yaml
        externalPayload: true

  - name: real-api
    endpoint: https://api.example.com
    listen: false
```

**What happens:**
1. Request comes to port 20000
2. Forwarded to real API
3. Real API response is recorded to YAML file
4. Response is returned to client

### Learning Properties

| Property | Type | Description |
|----------|------|-------------|
| `pathTemplate` | String | File path pattern for recordings |
| `externalPayload` | Boolean | Store large payloads in separate files |
| `learnOn` | Array | Conditional recording rules |
| `patterns` | Array | Filter which requests to record |
| `sort` | String | Sorting method (ByConnection, ByPath, ByTimestamp) |

### Conditional Learning

Record only specific requests:

```yaml
connections:
  - name: selective-learning-proxy
    port: 21000
    forward:
      mode: Learning
      to: real-api
      learning:
        pathTemplate: ./recordings/{path}.yaml
        # Only record POST requests
        learnOn:
          - property: Method
            value: POST
        # Only record successful responses
        patterns:
          - property: StatusCode
            value: 200
            operator: Equal

  - name: real-api
    endpoint: https://api.example.com
    listen: false
```

### External Payload Storage

Store large payloads separately:

```yaml
connections:
  - name: learning-proxy
    port: 22000
    forward:
      mode: Learning
      to: real-api
      learning:
        pathTemplate: ./recordings/{timestamp}.yaml
        externalPayload: true  # Payloads saved to {timestamp}_payload.json

  - name: real-api
    endpoint: https://api.example.com
    listen: false
```

**Generated files:**
```
recordings/
  ├── 2025-10-08T16-30-45_request.yaml
  ├── 2025-10-08T16-30-45_payload.json
  ├── 2025-10-08T16-31-22_request.yaml
  └── 2025-10-08T16-31-22_payload.json
```

---

## SimulateOn (Conditional Fallback)

Define conditions for falling back to simulation when forwarding.

### Fallback on Status Codes

```yaml
connections:
  - name: conditional-proxy
    port: 23000
    forward:
      mode: ForwardFirst
      to: real-api
      simulateOn:
        # Simulate if real API returns these status codes
        statusCodes:
          - 500
          - 502
          - 503
          - 504
        # Or use ranges
        # statusCodes: "5xx"

  - name: real-api
    endpoint: https://api.example.com
    listen: false

services:
  - name: ErrorFallback
    steps:
      - direction: In
      - direction: Out
        message:
          statusCode: 200
          payload: '{"fallback": true, "reason": "real API error"}'
```

### Fallback on Timeout

```yaml
connections:
  - name: timeout-fallback
    port: 24000
    forward:
      mode: ForwardFirst
      to: slow-api
      simulateOn:
        # Simulate if real API takes longer than 3 seconds
        timeout: 3000

  - name: slow-api
    endpoint: https://slow-api.example.com
    listen: false

services:
  - name: TimeoutFallback
    steps:
      - direction: In
      - direction: Out
        message:
          statusCode: 200
          payload: '{"fallback": true, "reason": "timeout"}'
```

### Fallback on Header

```yaml
connections:
  - name: header-conditional
    port: 25000
    forward:
      mode: ForwardFirst
      to: real-api
      simulateOn:
        # Simulate if request has specific header
        trigger:
          - type: Header
            key: X-Simulate
            value: "true"

  - name: real-api
    endpoint: https://api.example.com
    listen: false

services:
  - name: SimulatedResponse
    steps:
      - direction: In
      - direction: Out
        message:
          payload: '{"simulated": true}'
```

**Usage:**
```bash
# With X-Simulate header → uses simulation
curl -H "X-Simulate: true" http://localhost:25000/api/endpoint

# Without header → forwards to real API
curl http://localhost:25000/api/endpoint
```

---

## Complete Examples

### Example 1: Resilient LLM Proxy

```yaml
schema: SimV1
name: resilient-llm-proxy

connections:
  - name: claude-proxy
    port: 17070
    forward:
      mode: ForwardFirst
      to: real-claude-api
      simulateOn:
        statusCodes: "5xx"
        timeout: 10000

  - name: real-claude-api
    endpoint: https://api.anthropic.com
    listen: false
    headers:
      - key: x-api-key
        value: ${ANTHROPIC_API_KEY}

services:
  - name: ClaudeFallback
    description: Fallback when real Claude API is unavailable
    steps:
      - direction: In
        trigger:
          - uri: "/v1/messages"

      - direction: Out
        message:
          statusCode: 200
          delay: 1000
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
                  "text": "This is a fallback simulated response because the real Claude API is unavailable."
                }
              ],
              "model": "claude-3-5-sonnet-20241022",
              "usage": {
                "input_tokens": 25,
                "output_tokens": 20
              }
            }
```

### Example 2: Learning Mode for API Documentation

```yaml
schema: SimV1
name: api-learning-recorder

connections:
  - name: recording-proxy
    port: 28000
    forward:
      mode: Learning
      to: target-api
      learning:
        pathTemplate: ./recordings/{method}_{path}_{timestamp}.yaml
        externalPayload: true
        # Only record successful requests
        learnOn:
          - property: StatusCode
            value: 200
        # Sort by API path
        sort: ByPath

  - name: target-api
    endpoint: http://localhost:7002
    listen: false

# No services needed - pure recording mode
```

**Run traffic through the proxy:**
```bash
# All requests are recorded
curl http://localhost:28000/api/v1/Books
curl http://localhost:28000/api/v1/Books/123
curl -X POST http://localhost:28000/api/v1/Books -d '{"title":"New Book"}'
```

**Generated recordings can be used as simulation files!**

### Example 3: Hybrid Test/Production Proxy

```yaml
schema: SimV1
name: hybrid-proxy

connections:
  - name: smart-proxy
    port: 29000
    forward:
      mode: SimulateFirst
      to: production-api

  - name: production-api
    endpoint: https://api.production.com
    listen: false
    authentication: Basic
    username: ${PROD_USER}
    password: ${PROD_PASSWORD}

services:
  # Mocked test endpoints
  - name: TestEndpoint1
    steps:
      - direction: In
        trigger:
          - uri: "/test/endpoint1"
      - direction: Out
        message:
          payload: '{"test": true, "endpoint": 1}'

  - name: TestEndpoint2
    steps:
      - direction: In
        trigger:
          - uri: "/test/endpoint2"
      - direction: Out
        message:
          payload: '{"test": true, "endpoint": 2}'

  # All other endpoints → forwarded to production
```

**Behavior:**
- `/test/endpoint1` → Simulated (no prod call)
- `/test/endpoint2` → Simulated (no prod call)
- `/api/users` → Forwarded to production
- `/api/orders` → Forwarded to production

---

## Connection Capture

Enable message capture for debugging:

```yaml
connections:
  - name: debug-connection
    port: 30000
    capture: true  # Captures all traffic to logs
    forward:
      mode: PassThrough
      to: real-api

  - name: real-api
    endpoint: https://api.example.com
    listen: false
```

**Captured data includes:**
- Request headers, body, timestamp
- Response headers, body, timestamp
- Status codes
- Response times

---

## Common Mistakes

### ❌ Missing target connection

```yaml
connections:
  - name: proxy
    port: 8000
    forward:
      mode: PassThrough
      to: real-api  # ❌ 'real-api' not defined
```

✅ Fix:
```yaml
connections:
  - name: proxy
    port: 8000
    forward:
      mode: PassThrough
      to: real-api

  - name: real-api  # ✅ Define target
    endpoint: https://api.example.com
    listen: false
```

### ❌ Using services with PassThrough

```yaml
connections:
  - name: proxy
    port: 8000
    forward:
      mode: PassThrough
      to: real-api

services:  # ❌ Services ignored in PassThrough mode
  - steps:
      - direction: In
      - direction: Out
```

✅ Fix: Use `ForwardFirst` or `SimulateFirst` if you need services

### ❌ Circular forwarding

```yaml
connections:
  - name: connection-a
    forward:
      to: connection-b

  - name: connection-b
    forward:
      to: connection-a  # ❌ Circular reference
```

---

## Next Steps

- **[02-CONNECTIONS.md](./02-CONNECTIONS.md)** - Connection basics
- **[10-TROUBLESHOOTING.md](./10-TROUBLESHOOTING.md)** - Debug forwarding issues
- **[08-RESOURCES-TEMPLATES.md](./08-RESOURCES-TEMPLATES.md)** - Combine with templates
