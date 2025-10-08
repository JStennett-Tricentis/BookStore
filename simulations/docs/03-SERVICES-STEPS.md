# Tricentis API Simulator - Services and Steps

**Reference**: `/Users/j.stennett/API Simulator/api-simulator-examples/Examples/`, `/Users/j.stennett/API Simulator/api-simulator-examples/Petstore/`

## Overview

Services define the **business logic** of your simulation. Each service contains a sequence of **steps** that process requests and generate responses.

## Basic Structure

```yaml
schema: SimV1
name: my-simulation

services:
  - name: MyService # Optional service name
    steps:
      - direction: In # Step 1: Receive request
        trigger:
          - uri: "/api/test"
      - direction: Out # Step 2: Send response
        message:
          payload: Success!
```

## Services

### Service Properties

| Property | Required | Type   | Description                                |
| -------- | -------- | ------ | ------------------------------------------ |
| `name`   | ❌ No    | String | Service identifier (for logging/debugging) |
| `steps`  | ✅ Yes   | Array  | Sequence of processing steps               |

### Named Services

```yaml
services:
  - name: CreateBook # Named for clarity
    steps:
      - direction: In
        trigger:
          - uri: "/api/books"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 201
          payload: '{"id": "123"}'

  - name: GetBooks # Another named service
    steps:
      - direction: In
        trigger:
          - uri: "/api/books"
          - method: "GET"
      - direction: Out
        message:
          payload: "[]"
```

### Anonymous Services

```yaml
services:
  - steps: # No name - acceptable for simple cases
      - direction: In
        trigger:
          - uri: "*"
      - direction: Out
        message:
          payload: Hello world!
```

## Steps

Steps define the **sequence of operations** within a service. They execute in order from top to bottom.

### Step Directions

| Direction | Purpose                             | Common Uses                        |
| --------- | ----------------------------------- | ---------------------------------- |
| `In`      | Receive/match incoming request      | Request matching, validation       |
| `Out`     | Send response or make external call | Return response, call external API |

### Step Properties

| Property    | Type   | Required     | Description                   |
| ----------- | ------ | ------------ | ----------------------------- |
| `direction` | String | ✅ Yes       | `In` or `Out`                 |
| `name`      | String | ❌ No        | Step identifier (for logging) |
| `trigger`   | Array  | ⚠️ For `In`  | Request matching conditions   |
| `message`   | Object | ⚠️ For `Out` | Response or request message   |
| `to`        | String | ⚠️ For `Out` | Target connection name        |
| `from`      | String | ❌ No        | Source connection name        |
| `buffer`    | Array  | ❌ No        | Capture data for later use    |
| `insert`    | Array  | ❌ No        | Inject dynamic values         |
| `verify`    | Array  | ❌ No        | Validate response             |

## Common Patterns

### 1. Simple Request/Response

The most basic pattern - receive request, send response:

```yaml
services:
  - name: SimpleEcho
    steps:
      # Step 1: Match incoming request
      - direction: In
        trigger:
          - uri: "/echo"
          - method: "POST"

      # Step 2: Send response
      - direction: Out
        message:
          statusCode: 200
          payload: Echo response
```

### 2. External API Call

Make an outgoing request to an external API:

```yaml
connections:
  - name: external-api
    endpoint: https://api.example.com/endpoint
    listen: false

services:
  - name: CallExternalAPI
    steps:
      # Step 1: Send request to external API
      - direction: Out
        to: external-api # Reference connection
        message:
          method: POST
          headers:
            - key: authorization
              value: Bearer token-123
          payload: '{"request": "data"}'

      # Step 2: Receive response from external API
      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
```

### 3. Multi-Step Processing

Chain multiple steps together:

```yaml
services:
  - name: MultiStepProcess
    steps:
      # Step 1: Receive initial request
      - direction: In
        name: ReceiveRequest
        trigger:
          - uri: "/process"

      # Step 2: Call external service
      - direction: Out
        name: CallExternalService
        to: external-connection
        message:
          method: POST
          payload: '{"data": "value"}'

      # Step 3: Receive external response
      - direction: In
        name: ReceiveExternalResponse

      # Step 4: Send final response to client
      - direction: Out
        name: SendFinalResponse
        message:
          statusCode: 200
          payload: '{"result": "success"}'
```

### 4. Conditional Responses

Different responses based on request content:

```yaml
services:
  # Service 1: Handle VIP users
  - name: VIPHandler
    steps:
      - direction: In
        trigger:
          - uri: "/api/users"
          - jsonPath: user_type
            value: vip
      - direction: Out
        message:
          payload: '{"priority": "high", "discount": 20}'

  # Service 2: Handle regular users
  - name: RegularHandler
    steps:
      - direction: In
        trigger:
          - uri: "/api/users"
          - jsonPath: user_type
            value: regular
      - direction: Out
        message:
          payload: '{"priority": "normal", "discount": 5}'
```

### 5. Named Steps for Clarity

```yaml
services:
  - name: BookCreation
    steps:
      - name: ValidateBookRequest
        direction: In
        trigger:
          - uri: "/api/books"
          - method: "POST"
          - jsonPath: title
            value: "*"

      - name: ReturnCreatedBook
        direction: Out
        message:
          statusCode: 201
          headers:
            - key: location
              value: "/api/books/{randomGuid}"
          payload: |
            {
              "id": "{randomGuid}",
              "title": "Book Title",
              "created_at": "{timestamp}"
            }
```

## Direction: In

`direction: In` steps receive and match incoming requests or responses.

### In Step with Trigger (Inbound Request)

```yaml
- direction: In
  trigger:
    - uri: "/api/endpoint"
    - method: "POST"
    - header:
        name: "content-type"
        value: "application/json"
```

### In Step with Verify (Inbound Response)

Used to validate responses from external APIs:

```yaml
- direction: In
  verify:
    - property: StatusCode
      value: 200 OK
    - jsonPath: result
      value: success
```

## Direction: Out

`direction: Out` steps send responses or make external requests.

### Out Step as Response

Send response to incoming request:

```yaml
- direction: Out
  message:
    statusCode: 200
    headers:
      - key: content-type
        value: application/json
    payload: '{"status": "success"}'
```

### Out Step as External Request

Send request to external API:

```yaml
- direction: Out
  to: external-connection # Required for external calls
  message:
    method: POST
    headers:
      - key: authorization
        value: Bearer token
    payload: '{"data": "value"}'
```

## Step Execution Flow

### Flow 1: Simple Service (Incoming Request)

```text
Client → [In: Match Request] → [Out: Send Response] → Client
```

```yaml
services:
  - steps:
      - direction: In # Match incoming request
        trigger:
          - uri: "/test"
      - direction: Out # Send response back
        message:
          payload: Success
```

### Flow 2: External API Call

```text
Simulator → [Out: Send Request] → External API
           ← [In: Receive Response] ←
```

```yaml
services:
  - steps:
      - direction: Out # Send request to external API
        to: external-api
        message:
          method: GET
      - direction: In # Receive response
        verify:
          - property: StatusCode
            value: 200 OK
```

### Flow 3: Proxy Pattern

```text
Client → [In: Receive] → [Out: Forward] → External API
       ← [In: Response] ← [Out: Return] ←
```

```yaml
services:
  - steps:
      - direction: In # Receive from client
        trigger:
          - uri: "/proxy/*"
      - direction: Out # Forward to external API
        to: external-api
      - direction: In # Receive response from API
      - direction: Out # Return to client
```

## Connection References

### Using `to` Property

```yaml
connections:
  - name: my-api
    endpoint: https://api.example.com

services:
  - steps:
      - direction: Out
        to: my-api # Reference connection by name
        message:
          method: POST
```

### Using `from` Property

```yaml
connections:
  - name: my-listener
    port: 17071

services:
  - steps:
      - direction: In
        from: my-listener # Specify which listener
        trigger:
          - uri: "/test"
```

## Advanced Features

### Buffers

Capture data from requests for later use:

```yaml
steps:
  - direction: In
    buffer:
      - jsonPath: user.name
        name: userName # Save as 'userName'
      - jsonPath: user.email
        name: userEmail

  - direction: Out
    message:
      payload: "Hello {B[userName]}, your email is {B[userEmail]}"
```

### Insert

Inject dynamic values into messages:

```yaml
steps:
  - direction: Out
    insert:
      - jsonPath: id
        value: "{randomGuid}"
      - jsonPath: timestamp
        value: "{timestamp}"
    message:
      payload: |
        {
          "id": "will-be-replaced",
          "timestamp": "will-be-replaced"
        }
```

### Verify

Validate incoming responses:

```yaml
steps:
  - direction: In
    verify:
      - property: StatusCode
        value: 200 OK
      - jsonPath: status
        value: success
      - property: Delay
        value: "{REGEX[^([1-9]|[0-9]{2,3})$]}" # Response time validation
```

## Complete Examples

### REST API Simulation

```yaml
schema: SimV1
name: book-api

connections:
  - name: book-service
    port: 18000

services:
  # GET /books
  - name: ListBooks
    steps:
      - direction: In
        from: book-service
        trigger:
          - uri: "/books"
          - method: "GET"
      - direction: Out
        message:
          statusCode: 200
          payload: '[{"id": "1", "title": "Book 1"}]'

  # POST /books
  - name: CreateBook
    steps:
      - direction: In
        from: book-service
        trigger:
          - uri: "/books"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 201
          headers:
            - key: location
              value: "/books/{randomGuid}"
          payload: '{"id": "{randomGuid}", "title": "New Book"}'

  # GET /books/{id}
  - name: GetBook
    steps:
      - direction: In
        from: book-service
        trigger:
          - uri: "/books/*"
          - method: "GET"
      - direction: Out
        message:
          statusCode: 200
          payload: '{"id": "123", "title": "Specific Book"}'

  # DELETE /books/{id}
  - name: DeleteBook
    steps:
      - direction: In
        from: book-service
        trigger:
          - uri: "/books/*"
          - method: "DELETE"
      - direction: Out
        message:
          statusCode: 204
```

## Common Mistakes

### ❌ Missing direction

```yaml
steps:
  - trigger: # ❌ Missing direction: In
      - uri: "/test"
```

### ✅ Always specify direction

```yaml
steps:
  - direction: In
    trigger:
      - uri: "/test"
```

### ❌ Out step without message or to

```yaml
steps:
  - direction: Out # ❌ No message and no 'to'
```

### ✅ Out step must have message or to

```yaml
steps:
  - direction: Out
    message:
      payload: Response
```

### ❌ Using 'to' for response

```yaml
steps:
  - direction: In
    trigger:
      - uri: "/test"
  - direction: Out
    to: some-connection # ❌ This makes external call, not response!
    message:
      payload: Response
```

### ✅ Omit 'to' for responses

```yaml
steps:
  - direction: In
    trigger:
      - uri: "/test"
  - direction: Out # ✅ No 'to' = response to request
    message:
      payload: Response
```

## Next Steps

- [Triggers](./05-TRIGGERS.md) - Request matching patterns
- [Messages](./04-MESSAGES.md) - Response structure
- [Connections](./02-CONNECTIONS.md) - External endpoints
