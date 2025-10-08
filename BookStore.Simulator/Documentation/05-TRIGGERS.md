# Tricentis API Simulator - Triggers

**Reference**: `/Users/j.stennett/API Simulator/api-simulator-examples/operators/`, `/Users/j.stennett/API Simulator/api-simulator-examples/Petstore/`

## Overview

Triggers define **matching conditions** that determine which service handles an incoming request.

Multiple trigger conditions are combined with **AND** logic (all must match).

## Basic Trigger Structure

```yaml
services:
  - name: MyService
    steps:
      - direction: In
        trigger:
          - uri: "/api/endpoint"
          - method: "POST"
          - header:
              name: "content-type"
              value: "application/json"
```

## Trigger Types

### 1. URI/Path Matching

Match incoming request paths:

```yaml
trigger:
  - uri: "/v1/messages" # Exact match
  - uri: "/api/*" # Wildcard match
  - uri: "*" # Match all paths
```

**Alternative syntax**:

```yaml
trigger:
  - type: Path
    value: "/v2/pet"
```

### 2. HTTP Method Matching

Match HTTP methods:

```yaml
trigger:
  - method: "POST"
  - method: "GET"
  - method: "PUT"
  - method: "DELETE"
```

**Alternative syntax**:

```yaml
trigger:
  - property: Method
    value: POST
```

### 3. Header Matching

Match request headers:

```yaml
trigger:
  - header:
      name: "anthropic-version"
      value: "2023-06-01"
  - header:
      name: "authorization"
      value: "*" # Any value
```

**Alternative syntax**:

```yaml
trigger:
  - type: Header
    key: simulate
    value: true
```

### 4. Query Parameter Matching

Match URL query parameters:

```yaml
trigger:
  - type: Query
    key: status
    value: available
  - type: Query
    key: provider
    value: ollama
```

**Example URL**: `http://localhost:7002/api/v1/Books?status=available`

### 5. JSON Body Matching (JSONPath)

Match content within JSON request bodies:

```yaml
trigger:
  - jsonPath: name
    value: "John Doe"
  - jsonPath: user.email
    value: "user@example.com"
  - jsonPath: settings.enabled
    value: true
```

**JSONPath Syntax**:

- `name` - Top-level field
- `user.email` - Nested field
- `items[0].id` - Array element
- `metadata.tags[*]` - All array elements

### 6. XML Body Matching (XPath)

Match content within XML/SOAP request bodies:

```yaml
trigger:
  - xPath: /*[local-name()='Envelope']/*[local-name()='Body']/*[local-name()='Add']/*[local-name()='n1']
    value: 100
```

**XPath Best Practice**: Use `local-name()` to avoid namespace issues.

## Operators

Operators define **how** values are compared. Default is `Equal`.

### Available Operators

| Operator         | Description              | Example Use Case                      |
| ---------------- | ------------------------ | ------------------------------------- |
| `Equal`          | Exact match (default)    | `value: "active"`                     |
| `NotEqual`       | Not equal to             | `value: 100, operator: NotEqual`      |
| `Less`           | Less than                | `value: 10, operator: Less`           |
| `Greater`        | Greater than             | `value: 5, operator: Greater`         |
| `LessOrEqual`    | Less than or equal       | `value: 100, operator: LessOrEqual`   |
| `GreaterOrEqual` | Greater than or equal    | `value: 18, operator: GreaterOrEqual` |
| `REGEX`          | Regular expression match | `value: "^user_.*", operator: REGEX`  |

### Operator Examples

```yaml
trigger:
  # Greater than comparison
  - jsonPath: age
    value: 18
    dataType: Numeric
    operator: Greater

  # Not equal
  - jsonPath: status
    value: deleted
    operator: NotEqual

  # Date comparison
  - jsonPath: created_date
    value: "{Date[07.04.2020][][dd.MM.yyyy]}"
    dataType: Date
    operator: Greater

  # Range checks
  - jsonPath: price
    value: 10
    dataType: Numeric
    operator: GreaterOrEqual
  - jsonPath: price
    value: 100
    dataType: Numeric
    operator: LessOrEqual
```

## Data Types

Specify `dataType` for non-string comparisons:

```yaml
trigger:
  - jsonPath: quantity
    value: 5
    dataType: Numeric # For numbers
    operator: Greater

  - jsonPath: created_at
    value: "{Date[01.01.2024][][dd.MM.yyyy]}"
    dataType: Date # For dates
    operator: Greater

  - jsonPath: name
    value: "John"
    # dataType: String is default, can be omitted
```

**Supported Data Types**:

- `String` (default)
- `Numeric`
- `Date`

## Complete Example

```yaml
services:
  - name: ComplexTriggerExample
    steps:
      - direction: In
        trigger:
          # Path must be /api/books
          - type: Path
            value: /api/books

          # Method must be POST
          - property: Method
            value: POST

          # Must have content-type header
          - header:
              name: content-type
              value: application/json

          # Book category must be "fiction"
          - jsonPath: category
            value: fiction

          # Price must be between 10 and 100
          - jsonPath: price
            value: 10
            dataType: Numeric
            operator: GreaterOrEqual
          - jsonPath: price
            value: 100
            dataType: Numeric
            operator: LessOrEqual

          # Pages must be more than 50
          - jsonPath: pages
            value: 50
            dataType: Numeric
            operator: Greater

      - direction: Out
        message:
          statusCode: 200
          payload: '{"result": "Book added successfully"}'
```

## Conditional Forwarding

Use triggers to conditionally forward to real APIs:

```yaml
connections:
  - name: conditional-proxy
    port: 11337
    forward:
      to: real-api-connection
      simulateOn:
        trigger:
          - type: Header
            key: simulate
            value: true

  - name: real-api-connection
    endpoint: https://api.real-service.com
    listen: false

services:
  - name: SimulatedResponse
    steps:
      - direction: In
      - direction: Out
        message:
          payload: '{"source": "simulated"}'
```

**Behavior**:

- If request has header `simulate: true` → Use simulation
- Otherwise → Forward to real API

## Wildcard Matching

```yaml
trigger:
  - uri: "*" # Match any path
  - method: "*" # Match any method
  - header:
      name: "x-api-key"
      value: "*" # Any header value (header must exist)
```

## Common Patterns

### REST API Endpoints

```yaml
# GET /api/books
- trigger:
    - uri: "/api/books"
    - method: "GET"

# POST /api/books
- trigger:
    - uri: "/api/books"
    - method: "POST"

# PUT /api/books/{id}
- trigger:
    - uri: "/api/books/*"
    - method: "PUT"

# DELETE /api/books/{id}
- trigger:
    - uri: "/api/books/*"
    - method: "DELETE"
```

### LLM API Endpoints

```yaml
# Claude API
- trigger:
    - uri: "/v1/messages"
    - method: "POST"
    - header:
        name: "anthropic-version"
        value: "*"

# OpenAI API
- trigger:
    - uri: "/v1/chat/completions"
    - method: "POST"
    - header:
        name: "authorization"
        value: "Bearer *"
```

### Query Parameter Routing

```yaml
# /api/books?provider=ollama
- trigger:
    - uri: "/api/books"
    - type: Query
      key: provider
      value: ollama

# /api/books?provider=claude
- trigger:
    - uri: "/api/books"
    - type: Query
      key: provider
      value: claude
```

## Common Mistakes

### ❌ Missing quotes around values

```yaml
trigger:
  - uri: /api/endpoint # ❌ May cause issues
```

### ✅ Use quotes for strings

```yaml
trigger:
  - uri: "/api/endpoint" # ✅ Safe
```

### ❌ Wrong header format

```yaml
trigger:
  - header: content-type # ❌ Wrong format
```

### ✅ Correct header format

```yaml
trigger:
  - header:
      name: "content-type"
      value: "application/json"
```

### ❌ Using operator without dataType

```yaml
trigger:
  - jsonPath: age
    value: 18
    operator: Greater # ❌ Will compare as strings!
```

### ✅ Specify dataType for numeric comparisons

```yaml
trigger:
  - jsonPath: age
    value: 18
    dataType: Numeric
    operator: Greater
```

## Next Steps

- [OpenAI/LLM Patterns](./06-OPENAI-LLM.md) - AI API specific examples
- [Messages](./04-MESSAGES.md) - Response payloads
