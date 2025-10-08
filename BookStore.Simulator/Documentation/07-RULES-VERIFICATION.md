# Tricentis API Simulator - Rules and Verification

**Master verify, buffer, insert, save, and trigger rules**

## Overview

**Rules** are the building blocks for:

- **trigger** - Match incoming requests
- **verify** - Validate responses
- **buffer** - Capture data for later use
- **insert** - Inject dynamic values
- **save** - Persist data to files

All rules use the same `RuleV1` structure from the schema.

---

## Rule Structure

### Basic Rule Properties

| Property   | Type    | Description                                            |
| ---------- | ------- | ------------------------------------------------------ |
| `property` | String  | Message/connection property (StatusCode, Method, etc.) |
| `jsonPath` | String  | JSON field path (e.g., `user.email`)                   |
| `xPath`    | String  | XML field path                                         |
| `type`     | String  | Rule type (Header, Query, Path, Payload, etc.)         |
| `key`      | String  | Header/query parameter name                            |
| `value`    | Any     | Expected/injected value                                |
| `operator` | String  | Comparison operator (Equal, Greater, Less, etc.)       |
| `dataType` | String  | Value type (String, Numeric, Date, Boolean)            |
| `exists`   | Boolean | Check if field exists                                  |
| `count`    | Number  | Verify element count                                   |
| `name`     | String  | Buffer/reference name                                  |
| `file`     | String  | File path for save                                     |

---

##

1.  Verify Rules (Response Validation)

Use `verify` in **`In`** steps to validate responses from external APIs.

### Basic Verification

```yaml
steps:
  - direction: Out
    to: external-api
    message:
      method: GET

  - direction: In
    verify:
      - property: StatusCode
        value: 200 OK

      - jsonPath: status
        value: success

      - jsonPath: data.id
        exists: true
```

### Property Verification

Validate message/connection properties:

```yaml
verify:
  # Status code
  - property: StatusCode
    value: 200 OK

  # HTTP method
  - property: Method
    value: GET

  # Endpoint
  - property: Endpoint
    value: http://localhost:7002

  # Delay (response time in ms)
  - property: Delay
    value: 5000
    operator: Less
```

**Available Properties:**

- StatusCode
- Method
- Endpoint
- Delay
- Queue, Topic, Exchange (for message brokers)
- Username, Password

### JSONPath Verification

Validate JSON response fields:

```yaml
verify:
  # Simple field
  - jsonPath: id
    value: "123"

  # Nested field
  - jsonPath: user.email
    value: "user@example.com"

  # Array element
  - jsonPath: items[0].name
    value: "First Item"

  # Field existence
  - jsonPath: metadata.created_at
    exists: true

  # Array length
  - jsonPath: items
    count: 5
```

### Numeric Comparisons

```yaml
verify:
  # Greater than
  - jsonPath: usage.input_tokens
    value: 10
    dataType: Numeric
    operator: Greater

  # Range check
  - jsonPath: price
    value: 10
    dataType: Numeric
    operator: GreaterOrEqual
  - jsonPath: price
    value: 100
    dataType: Numeric
    operator: LessOrEqual

  # Not equal
  - jsonPath: stock
    value: 0
    dataType: Numeric
    operator: NotEqual
```

### Date Comparisons

```yaml
verify:
  - jsonPath: created_at
    value: "{Date[01.01.2024][][dd.MM.yyyy]}"
    dataType: Date
    operator: Greater

  - jsonPath: expires_at
    value: "{Date[31.12.2025][][dd.MM.yyyy]}"
    dataType: Date
    operator: Less
```

### Regex Validation

```yaml
verify:
  # UUID format
  - jsonPath: id
    value: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    operator: REGEX

  # Email format
  - jsonPath: email
    value: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    operator: REGEX

  # Response time < 1000ms
  - property: Delay
    value: "^[0-9]{1,3}$"
    operator: REGEX
```

### Complete Verification Example

```yaml
schema: SimV1
name: api-verification-test

connections:
  - name: book-api
    endpoint: http://localhost:7002
    listen: false

services:
  - name: VerifyBookCreation
    description: Validates POST /api/v1/Books response
    steps:
      - direction: Out
        to: book-api
        message:
          method: POST
          headers:
            - key: Content-Type
              value: application/json
          payload: |-
            {
              "title": "Test Book",
              "author": "Test Author"
            }
        insert:
          - type: Path
            value: /api/v1/Books

      - direction: In
        verify:
          # Status code must be 201 Created
          - property: StatusCode
            value: 201 Created

          # Response must contain id
          - jsonPath: id
            exists: true

          # ID must be valid GUID
          - jsonPath: id
            value: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
            operator: REGEX

          # Title must match request
          - jsonPath: title
            value: Test Book

          # Response time < 2000ms
          - property: Delay
            value: 2000
            dataType: Numeric
            operator: Less
```

---

## 2. Buffer Rules (Data Capture)

Use `buffer` to capture data from requests/responses for later use.

### Basic Buffering

```yaml
steps:
  - direction: In
    buffer:
      - jsonPath: user.id
        name: userId
      - jsonPath: user.email
        name: userEmail
      - jsonPath: request.timestamp
        name: requestTime

  - direction: Out
    message:
      payload: |-
        {
          "user_id": "{B[userId]}",
          "email": "{B[userEmail]}",
          "processed_at": "{timestamp}",
          "request_received_at": "{B[requestTime]}"
        }
```

### Buffer from Headers

```yaml
steps:
  - direction: In
    buffer:
      - type: Header
        key: X-Request-ID
        name: requestId
      - type: Header
        key: Authorization
        name: authToken

  - direction: Out
    message:
      headers:
        - key: X-Request-ID
          value: "{B[requestId]}"
      payload: "Request ID: {B[requestId]}"
```

### Buffer from Query Parameters

```yaml
steps:
  - direction: In
    trigger:
      - uri: "/api/search"
    buffer:
      - type: Query
        key: q
        name: searchQuery
      - type: Query
        key: page
        name: pageNumber

  - direction: Out
    message:
      payload: |-
        {
          "query": "{B[searchQuery]}",
          "page": "{B[pageNumber]}",
          "results": []
        }
```

### Buffer Complex Data

```yaml
steps:
  - direction: In
    buffer:
      # Capture entire JSON tree
      - jsonPath: user
        name: userObject
        tree: |-
          {
            "name": "value",
            "email": "value"
          }

      # Capture array
      - jsonPath: items
        name: itemsList

  - direction: Out
    message:
      payload: |-
        {
          "original_user": {B[userObject]},
          "items_count": {B[itemsList].length}
        }
```

---

## 3. Insert Rules (Dynamic Value Injection)

Use `insert` to inject dynamic values into outgoing messages.

### Insert into Path

```yaml
steps:
  - direction: Out
    to: external-api
    message:
      method: GET
    insert:
      - type: Path
        value: /api/v1/Books/{randomGuid}

      - type: Query
        key: provider
        value: ollama
```

### Insert into JSON Payload

```yaml
steps:
  - direction: Out
    insert:
      - jsonPath: id
        value: "{randomGuid}"

      - jsonPath: timestamp
        value: "{timestamp}"

      - jsonPath: random_number
        value: "{random[1][100]}"

    message:
      payload: |-
        {
          "id": "placeholder",
          "timestamp": "placeholder",
          "random_number": 0
        }
```

### Insert from Buffer

```yaml
steps:
  - direction: In
    buffer:
      - jsonPath: user.id
        name: userId

  - direction: Out
    to: external-api
    insert:
      - jsonPath: user_id
        value: "{B[userId]}"

      - type: Header
        key: X-User-ID
        value: "{B[userId]}"

    message:
      method: POST
      payload: |-
        {
          "user_id": "placeholder"
        }
```

### Insert with Base64

```yaml
steps:
  - direction: Out
    insert:
      - jsonPath: encoded_data
        valueBase64: "SGVsbG8gV29ybGQ=" # "Hello World" in base64

    message:
      payload: '{"encoded_data": ""}'
```

### Dynamic Values Available

| Placeholder                        | Example Output                         | Description              |
| ---------------------------------- | -------------------------------------- | ------------------------ |
| `{randomGuid}`                     | `550e8400-e29b-41d4-a716-446655440000` | UUID v4                  |
| `{timestamp}`                      | `2025-10-08T16:30:45Z`                 | ISO 8601 timestamp       |
| `{random[1][100]}`                 | `42`                                   | Random number (min, max) |
| `{B[bufferName]}`                  | `captured-value`                       | Buffered value           |
| `{Date[01.01.2024][][dd.MM.yyyy]}` | `2024-01-01`                           | Formatted date           |

---

## 4. Save Rules (Persist Data)

Use `save` to write data to files.

### Save Response to File

```yaml
steps:
  - direction: In
    save:
      - jsonPath: $
        file: ./logs/response.json

      - property: StatusCode
        file: ./logs/status.txt
```

### Save Specific Fields

```yaml
steps:
  - direction: In
    save:
      - jsonPath: id
        name: book_id
        file: ./logs/book_ids.txt

      - jsonPath: content[0].text
        name: llm_response
        file: ./logs/llm_responses.txt
```

### Save Headers

```yaml
steps:
  - direction: In
    save:
      - type: Header
        key: X-Request-ID
        file: ./logs/request_ids.txt
```

---

## 5. Complete Rule Examples

### Example 1: Full API Test with Verification

```yaml
schema: SimV1
name: complete-api-test

connections:
  - name: bookstore-api
    endpoint: http://localhost:7002
    listen: false

services:
  - name: CreateAndVerifyBook
    description: Create book and verify response
    steps:
      # Send request
      - direction: Out
        to: bookstore-api
        message:
          method: POST
          headers:
            - key: Content-Type
              value: application/json
          payload: |-
            {
              "title": "API Testing Guide",
              "author": "Test Author",
              "isbn": "978-1234567890"
            }
        insert:
          - type: Path
            value: /api/v1/Books

      # Receive and verify response
      - direction: In
        verify:
          # Must be 201 Created
          - property: StatusCode
            value: 201 Created

          # Must have Location header
          - type: Header
            key: Location
            exists: true

          # Response must contain id
          - jsonPath: id
            exists: true

          # Title must match
          - jsonPath: title
            value: API Testing Guide

          # Must respond within 3 seconds
          - property: Delay
            value: 3000
            dataType: Numeric
            operator: Less

        buffer:
          - jsonPath: id
            name: bookId

        save:
          - jsonPath: $
            file: ./logs/created_book.json
```

### Example 2: Buffer and Reuse Pattern

```yaml
schema: SimV1
name: buffer-reuse-pattern

connections:
  - name: api
    endpoint: http://localhost:7002
    listen: false

services:
  - name: CreateThenRetrieve
    description: Create resource then fetch it
    steps:
      # Step 1: Create book
      - direction: Out
        to: api
        message:
          method: POST
          payload: '{"title": "New Book"}'
        insert:
          - type: Path
            value: /api/v1/Books

      # Step 2: Capture book ID
      - direction: In
        verify:
          - property: StatusCode
            value: 201 Created
        buffer:
          - jsonPath: id
            name: createdBookId

      # Step 3: Fetch the created book
      - direction: Out
        to: api
        message:
          method: GET
        insert:
          - type: Path
            value: "/api/v1/Books/{B[createdBookId]}"

      # Step 4: Verify retrieval
      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
          - jsonPath: id
            value: "{B[createdBookId]}"
          - jsonPath: title
            value: New Book
```

### Example 3: Multi-Field Validation

```yaml
schema: SimV1
name: multi-field-validation

connections:
  - name: llm-api
    endpoint: http://localhost:17070
    listen: false

services:
  - name: ValidateLLMResponse
    steps:
      - direction: Out
        to: llm-api
        message:
          method: POST
          headers:
            - key: anthropic-version
              value: "2023-06-01"
          payload: |-
            {
              "model": "claude-3-5-sonnet-20241022",
              "max_tokens": 1024,
              "messages": [{"role": "user", "content": "Hello"}]
            }
        insert:
          - type: Path
            value: /v1/messages

      - direction: In
        verify:
          # Status
          - property: StatusCode
            value: 200 OK

          # Required fields exist
          - jsonPath: id
            exists: true
          - jsonPath: model
            exists: true
          - jsonPath: role
            exists: true
          - jsonPath: content
            exists: true
          - jsonPath: usage
            exists: true

          # Type checks
          - jsonPath: type
            value: message

          # Token usage validation
          - jsonPath: usage.input_tokens
            value: 0
            dataType: Numeric
            operator: Greater

          - jsonPath: usage.output_tokens
            value: 0
            dataType: Numeric
            operator: Greater

          # Response time check
          - property: Delay
            value: 10000
            dataType: Numeric
            operator: Less

        save:
          - jsonPath: content[0].text
            file: ./logs/llm_responses.txt
```

---

## Common Mistakes

### ❌ Using `validate` instead of `verify`

```yaml
steps:
  - direction: In
    validate: # ❌ Wrong property name
      - property: StatusCode
        value: 200 OK
```

✅ Fix:

```yaml
steps:
  - direction: In
    verify:
      - property: StatusCode
        value: 200 OK
```

### ❌ Using `statusCode:` instead of `property: StatusCode`

```yaml
steps:
  - direction: In
    verify:
      - statusCode: 200 OK # ❌ Wrong format
```

✅ Fix:

```yaml
steps:
  - direction: In
    verify:
      - property: StatusCode
        value: 200 OK
```

### ❌ Numeric comparison without dataType

```yaml
steps:
  - direction: In
    verify:
      - jsonPath: age
        value: 18
        operator: Greater # ❌ Will compare as strings!
```

✅ Fix:

```yaml
steps:
  - direction: In
    verify:
      - jsonPath: age
        value: 18
        dataType: Numeric
        operator: Greater
```

### ❌ Missing buffer name

```yaml
steps:
  - direction: In
    buffer:
      - jsonPath: user.id # ❌ No name to reference later
```

✅ Fix:

```yaml
steps:
  - direction: In
    buffer:
      - jsonPath: user.id
        name: userId # ✅ Can use {B[userId]} later
```

---

## Next Steps

- **[05-TRIGGERS.md](./05-TRIGGERS.md)** - Request matching (uses same rule structure)
- **[08-RESOURCES-TEMPLATES.md](./08-RESOURCES-TEMPLATES.md)** - File-based data sources
- **[10-TROUBLESHOOTING.md](./10-TROUBLESHOOTING.md)** - Debug verification failures
