# Tricentis API Simulator - OpenAI/LLM Patterns

**Reference**: `/Users/j.stennett/API Simulator/api-simulator-examples/OpenAI/`

## Overview

This guide covers simulating AI/LLM APIs including:

- OpenAI Chat Completions
- Claude Messages API
- Azure OpenAI
- AWS Bedrock
- Streaming responses (Server-Sent Events)

## Basic LLM Simulation

### Claude Messages API

```yaml
schema: SimV1
name: claude-api-mock

services:
  - name: ClaudeMessagesCreate
    steps:
      # Match incoming request
      - direction: In
        trigger:
          - uri: "/v1/messages"
          - method: "POST"
          - header:
              name: "anthropic-version"
              value: "*"

      # Return simulated response
      - direction: Out
        message:
          statusCode: 200
          headers:
            - key: "content-type"
              value: "application/json"
            - key: "request-id"
              value: "req_sim_{timestamp}"
          payload: |
            {
              "id": "msg_{randomGuid}",
              "type": "message",
              "role": "assistant",
              "content": [
                {
                  "type": "text",
                  "text": "This is a simulated Claude response."
                }
              ],
              "model": "claude-3-5-sonnet-20241022",
              "stop_reason": "end_turn",
              "stop_sequence": null,
              "usage": {
                "input_tokens": 128,
                "output_tokens": 256
              }
            }
```

### OpenAI Chat Completions API

```yaml
schema: SimV1
name: openai-api-mock

services:
  - name: OpenAIChatCompletions
    steps:
      - direction: In
        trigger:
          - uri: "/v1/chat/completions"
          - method: "POST"
          - header:
              name: "authorization"
              value: "Bearer *"

      - direction: Out
        message:
          statusCode: 200
          headers:
            - key: "content-type"
              value: "application/json"
          payload: |
            {
              "id": "chatcmpl-{randomGuid}",
              "object": "chat.completion",
              "created": {timestamp},
              "model": "gpt-4o",
              "choices": [
                {
                  "index": 0,
                  "message": {
                    "role": "assistant",
                    "content": "This is a simulated GPT-4 response."
                  },
                  "finish_reason": "stop"
                }
              ],
              "usage": {
                "prompt_tokens": 50,
                "completion_tokens": 100,
                "total_tokens": 150
              }
            }
```

## Streaming Responses (Server-Sent Events)

For AI APIs that stream token-by-token responses:

```yaml
schema: SimV1
name: openai-streaming

services:
  - name: StreamingChatCompletions
    steps:
      - direction: In
        trigger:
          - uri: "/v1/chat/completions"
          - method: "POST"
          - jsonPath: stream
            value: true

      - direction: Out
        message:
          statusCode: 200
          headers:
            - key: content-type
              value: text/event-stream # Required for SSE
            - key: cache-control
              value: no-cache, must-revalidate
            - key: x-accel-buffering
              value: no
          payload: |+
            data: {"choices":[{"delta":{"role":"assistant","content":""},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{"content":"This"},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{"content":" is"},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{"content":" a"},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{"content":" simulated"},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{"content":" streaming"},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{"content":" response"},"finish_reason":null,"index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: {"choices":[{"delta":{},"finish_reason":"stop","index":0}],"created":{timestamp},"id":"chatcmpl-{randomGuid}","model":"gpt-4o","object":"chat.completion.chunk"}

            data: [DONE]

```

**Key Points for Streaming**:

- Use `payload: |+` to preserve trailing newlines
- Content type must be `text/event-stream`
- Each chunk starts with `data:`
- Blank lines separate chunks
- End with `data: [DONE]`
- Set `x-accel-buffering: no` to prevent buffering

### Streaming Format Patterns

**OpenAI Streaming Format**:

```text
data: {"choices":[{"delta":{"content":"token"},"finish_reason":null}]}

data: [DONE]
```

**Claude Streaming Format**:

```text
event: message_start
data: {"type":"message_start","message":{"id":"msg_...","type":"message"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"token"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}

event: message_stop
data: {"type":"message_stop"}
```

## Testing Real LLM APIs

Use connections to forward requests to actual LLM APIs for testing:

```yaml
schema: SimV1
name: openai-test

connections:
  - name: openai-api
    endpoint: https://api.openai.com/v1/chat/completions
    listen: false

services:
  - name: TestRealOpenAI
    steps:
      # Send request to real API
      - direction: Out
        to: openai-api
        message:
          method: POST
          headers:
            - key: authorization
              value: Bearer sk-your-api-key-here
            - key: content-type
              value: application/json
          payload: |
            {
              "model": "gpt-4o",
              "messages": [
                {"role": "user", "content": "Say hello world"}
              ],
              "temperature": 0.7
            }

      # Verify response
      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
          - jsonPath: choices[0].message.content
            value: "*"
```

### Testing Claude API

```yaml
connections:
  - name: claude-api
    endpoint: https://api.anthropic.com/v1/messages
    listen: false

services:
  - name: TestRealClaude
    steps:
      - direction: Out
        to: claude-api
        message:
          method: POST
          headers:
            - key: x-api-key
              value: sk-ant-your-api-key-here
            - key: anthropic-version
              value: "2023-06-01"
            - key: content-type
              value: application/json
          payload: |
            {
              "model": "claude-3-5-sonnet-20241022",
              "max_tokens": 1024,
              "messages": [
                {"role": "user", "content": "Hello, Claude!"}
              ]
            }

      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
```

## Forward Modes

Control when to use simulation vs. real API:

### Mode 1: Simulate First (Default)

Try simulation first, fall back to real API if no match:

```yaml
connections:
  - name: hybrid-api
    port: 17070
    endpoint: https://api.openai.com/v1/chat/completions
    forward:
      mode: SimulateFirst # Try simulation first

services:
  - name: SimulatedEndpoint
    steps:
      - direction: In
        trigger:
          - uri: "/v1/chat/completions"
          - jsonPath: messages[0].content
            value: "test message" # Only match specific content
      - direction: Out
        message:
          payload: '{"simulated": true}'
```

**Behavior**:

- If request matches trigger → Use simulation
- If no match → Forward to real API

### Mode 2: Forward First

Try real API first, fall back to simulation if it fails:

```yaml
connections:
  - name: hybrid-api
    port: 17070
    endpoint: https://api.openai.com/v1/chat/completions
    forward:
      mode: ForwardFirst # Try real API first
```

**Behavior**:

- Try real API first
- If real API fails → Use simulation

### Mode 3: Conditional Forwarding

Forward based on headers or other triggers:

```yaml
connections:
  - name: conditional-proxy
    port: 17070
    forward:
      to: real-api
      simulateOn:
        trigger:
          - type: Header
            key: use-mock
            value: true

  - name: real-api
    endpoint: https://api.openai.com/v1/chat/completions
    listen: false

services:
  - name: MockResponse
    steps:
      - direction: In
      - direction: Out
        message:
          payload: '{"mock": true}'
```

**Usage**:

```bash
# Use simulation
curl -H "use-mock: true" http://localhost:17070/v1/chat/completions

# Use real API
curl http://localhost:17070/v1/chat/completions
```

## Dynamic Values

Use dynamic expressions in payloads:

```yaml
message:
  headers:
    - key: request-id
      value: "req_{timestamp}" # Unix timestamp
    - key: trace-id
      value: "{randomGuid}" # Random GUID
  payload: |
    {
      "id": "msg_{randomGuid}",
      "created": {timestamp},
      "model": "claude-3-5-sonnet-20241022",
      "content": [
        {
          "type": "text",
          "text": "{RND[100]}"           # Random number 0-99
        }
      ]
    }
```

**Available Dynamic Values**:

- `{timestamp}` - Unix timestamp (seconds since epoch)
- `{randomGuid}` - Random UUID/GUID
- `{RND[N]}` - Random number 0 to N-1
- `{Date[dd.MM.yyyy][format][parse]}` - Date manipulation

## Learning Mode

Capture real API traffic to create simulations automatically:

```yaml
connections:
  - name: learning-proxy
    port: 14444
    endpoint: https://api.openai.com/v1/chat/completions
    capture: true # Capture all traffic
    keepProcessed: true # Save captured messages
```

**Usage**:

```bash
# Route your application through the learning proxy
export OPENAI_API_BASE=http://localhost:14444/v1

# Make real API calls - they'll be captured and forwarded
curl http://localhost:14444/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -d '{"model": "gpt-4o", "messages": [...]}'
```

The simulator will capture both requests and responses, which you can use to create accurate simulations.

## Complete Examples

### Multi-Provider LLM Proxy

```yaml
schema: SimV1
name: multi-llm-proxy

connections:
  - name: llm-proxy
    port: 17070

services:
  # Claude endpoint
  - name: ClaudeProxy
    steps:
      - direction: In
        trigger:
          - uri: "/claude/*"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 200
          payload: |
            {
              "id": "msg_{randomGuid}",
              "type": "message",
              "role": "assistant",
              "content": [{"type": "text", "text": "Claude simulation"}],
              "model": "claude-3-5-sonnet-20241022",
              "usage": {"input_tokens": 100, "output_tokens": 200}
            }

  # OpenAI endpoint
  - name: OpenAIProxy
    steps:
      - direction: In
        trigger:
          - uri: "/openai/*"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 200
          payload: |
            {
              "id": "chatcmpl-{randomGuid}",
              "object": "chat.completion",
              "model": "gpt-4o",
              "choices": [{"message": {"role": "assistant", "content": "OpenAI simulation"}}],
              "usage": {"prompt_tokens": 50, "completion_tokens": 100, "total_tokens": 150}
            }

  # Bedrock endpoint
  - name: BedrockProxy
    steps:
      - direction: In
        trigger:
          - uri: "/bedrock/*"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 200
          payload: |
            {
              "id": "msg_{randomGuid}",
              "type": "message",
              "role": "assistant",
              "content": [{"type": "text", "text": "Bedrock simulation"}],
              "model": "us.anthropic.claude-sonnet-4-v1:0",
              "usage": {"input_tokens": 75, "output_tokens": 150}
            }
```

### Query Parameter-Based Routing

```yaml
services:
  - name: ProviderRouting
    steps:
      - direction: In
        trigger:
          - uri: "/v1/generate"
          - type: Query
            key: provider
            value: ollama
      - direction: Out
        message:
          payload: '{"provider": "ollama", "response": "Local model response"}'

  - name: ClaudeRouting
    steps:
      - direction: In
        trigger:
          - uri: "/v1/generate"
          - type: Query
            key: provider
            value: claude
      - direction: Out
        message:
          payload: '{"provider": "claude", "response": "Claude API response"}'
```

## Common Patterns

### Error Simulation

```yaml
services:
  - name: RateLimitError
    steps:
      - direction: In
        trigger:
          - uri: "/v1/messages"
          - jsonPath: test_error
            value: rate_limit
      - direction: Out
        message:
          statusCode: 429
          headers:
            - key: content-type
              value: application/json
          payload: |
            {
              "error": {
                "type": "rate_limit_error",
                "message": "Rate limit exceeded"
              }
            }
```

### Token Counting

```yaml
message:
  payload: |
    {
      "usage": {
        "input_tokens": {RND[500]},
        "output_tokens": {RND[1000]},
        "total_tokens": {RND[1500]}
      }
    }
```

## Common Mistakes

### ❌ Missing blank lines in streaming

```yaml
payload: |
  data: {"chunk": "1"}
  data: {"chunk": "2"}    # ❌ Missing blank line
```

### ✅ Correct streaming format

```yaml
payload: |+
  data: {"chunk": "1"}

  data: {"chunk": "2"}

  data: [DONE]

```

### ❌ Wrong content type for streaming

```yaml
headers:
  - key: content-type
    value: application/json # ❌ Should be text/event-stream
```

### ✅ Correct content type

```yaml
headers:
  - key: content-type
    value: text/event-stream
```

### ❌ Forgetting |+ for streaming payload

```yaml
payload: | # ❌ Will strip trailing newlines
  data: ...
```

### ✅ Use |+ to preserve newlines

```yaml
payload: |+ # ✅ Preserves trailing newlines
  data: ...

```

## Next Steps

- [Schema Basics](./01-SCHEMA-BASICS.md) - Overall structure
- [Triggers](./05-TRIGGERS.md) - Request matching
- [Messages](./04-MESSAGES.md) - Response formatting
