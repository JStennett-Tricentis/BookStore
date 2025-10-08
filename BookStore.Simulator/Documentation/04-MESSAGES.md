# Tricentis API Simulator - Messages

**Reference**: `/Users/j.stennett/API Simulator/api-simulator-examples/OpenAI/`

## Message Structure

Messages define the **response** (Out direction) or **request** (Out to external API) content.

```yaml
message:
  statusCode: 200 # HTTP status code
  headers: # Response headers
    - key: content-type
      value: application/json
  method: POST # HTTP method (for outgoing requests)
  payload: | # Response body (use | for multiline)
    {"result": "success"}
```

## Message Properties

| Property     | Type          | Direction      | Description                            |
| ------------ | ------------- | -------------- | -------------------------------------- |
| `statusCode` | Integer       | Out (Response) | HTTP status code (200, 404, 500, etc.) |
| `headers`    | Array         | Both           | HTTP headers as key-value pairs        |
| `method`     | String        | Out (Request)  | HTTP method (GET, POST, PUT, DELETE)   |
| `payload`    | String/Object | Both           | Message body content                   |

## Headers

Headers are defined as an array of objects with `key` and `value`:

```yaml
message:
  headers:
    - key: content-type
      value: application/json
    - key: authorization
      value: Bearer token-123
    - key: x-custom-header
      value: custom-value
```

### Common Headers for LLM APIs

```yaml
headers:
  - key: content-type
    value: application/json
  - key: anthropic-version # Claude specific
    value: "2023-06-01"
  - key: x-api-key # Claude auth
    value: sk-ant-...
  # OR
  - key: authorization # OpenAI auth
    value: Bearer sk-...
```

## Payload

### JSON Responses (Non-Streaming)

Use `|` for multiline JSON:

```yaml
message:
  statusCode: 200
  headers:
    - key: content-type
      value: application/json
  payload: |
    {
      "id": "msg_123",
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "This is a simulated response"
        }
      ],
      "model": "claude-3-5-sonnet-20241022",
      "usage": {
        "input_tokens": 128,
        "output_tokens": 256
      }
    }
```

### Streaming Responses (Server-Sent Events)

For AI APIs that stream responses:

```yaml
message:
  headers:
    - key: content-type
      value: text/event-stream # SSE content type
  payload: |+
    data: {"choices":[{"delta":{"content":"As"},"finish_reason":null}]}

    data: {"choices":[{"delta":{"content":" an"},"finish_reason":null}]}

    data: {"choices":[{"delta":{"content":" AI"},"finish_reason":null}]}

    data: [DONE]

```

**Key Points**:

- Use `|+` to preserve trailing newlines
- Each chunk starts with `data:`
- Blank lines separate chunks
- End with `data: [DONE]`

### Plain Text Responses

```yaml
message:
  payload: Hello world!
```

### XML Responses

```yaml
message:
  headers:
    - key: content-type
      value: application/xml
  payload: |
    <?xml version="1.0"?>
    <response>
      <status>success</status>
    </response>
```

## Status Codes

Common HTTP status codes:

```yaml
# Success
statusCode: 200    # OK
statusCode: 201    # Created
statusCode: 204    # No Content

# Client Errors
statusCode: 400    # Bad Request
statusCode: 401    # Unauthorized
statusCode: 403    # Forbidden
statusCode: 404    # Not Found
statusCode: 429    # Too Many Requests

# Server Errors
statusCode: 500    # Internal Server Error
statusCode: 502    # Bad Gateway
statusCode: 503    # Service Unavailable
```

## Outgoing Requests (to external APIs)

When calling an external API:

```yaml
steps:
  - direction: Out
    to: external-api-connection # Reference to connection
    message:
      method: POST
      headers:
        - key: authorization
          value: Bearer sk-...
        - key: content-type
          value: application/json
      payload: |
        {
          "model": "gpt-4",
          "messages": [{"role": "user", "content": "Hello"}]
        }
```

## Dynamic Values

You can use dynamic expressions (covered in advanced docs):

```yaml
message:
  headers:
    - key: request-id
      value: "req_{timestamp}" # Dynamic timestamp
    - key: trace-id
      value: "{randomGuid}" # Random GUID
  payload: |
    {
      "id": "msg_{randomGuid}",
      "timestamp": "{timestamp}"
    }
```

## Common Mistakes

### ❌ Missing pipe for multiline JSON

```yaml
message:
  payload: { "key": "value" } # ❌ Hard to read, error-prone
```

### ✅ Use pipe for multiline

```yaml
message:
  payload: |
    {
      "key": "value"
    }
```

### ❌ Wrong header format

```yaml
headers:
  content-type: application/json # ❌ Wrong format
```

### ✅ Correct header format

```yaml
headers:
  - key: content-type
    value: application/json
```

### ❌ Status code as string

```yaml
statusCode: "200" # ❌ Should be integer
```

### ✅ Status code as integer

```yaml
statusCode: 200
```

## Next Steps

- [Triggers](./05-TRIGGERS.md) - Match incoming requests
- [OpenAI/LLM Patterns](./06-OPENAI-LLM.md) - AI API examples
