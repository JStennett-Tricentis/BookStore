# Tricentis API Simulator - Resources and Templates

**Reusable data sources and configuration**

## Overview

- **Resources** - External data files (CSV, JSON, databases) used in simulations
- **Templates** - Reusable connections, messages, and services
- **Includes** - Import other simulation files

---

## Resources

Resources allow you to load data from external files and use it in your simulations.

### Resource Types

| Type       | Description         | Use Case                                   |
| ---------- | ------------------- | ------------------------------------------ |
| `Value`    | Single-value lists  | Load list of IDs, names, etc.              |
| `KeyValue` | Key-value pairs     | Load configuration settings                |
| `Table`    | CSV/database tables | Load structured data with multiple columns |

### Basic Resource Structure

```yaml
schema: SimV1
name: data-driven-simulation

resources:
  - name: books
    type: Table
    file: ./data/books.csv
    separator: ","
    properties:
      - id
      - title
      - author
      - price

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/books"
      - direction: Out
        message:
          payload: "{R[books]}" # Load all data from CSV
```

### Value Resources

Single-column data:

**File: `data/book-ids.txt`**

```
68dedb16887eae6ff6743f51
68e05e77604bb44693ad8e92
68e05e7d604bb44693ad8e93
```

**Simulation:**

```yaml
resources:
  - name: bookIds
    type: Value
    file: ./data/book-ids.txt

services:
  - steps:
      - direction: Out
        insert:
          - type: Path
            value: "/api/v1/Books/{R[bookIds][0]}" # Use first ID
        message:
          method: GET
```

### KeyValue Resources

Configuration pairs:

**File: `data/config.properties`**

```
apiKey=sk-test-12345
baseUrl=http://localhost:7002
timeout=5000
```

**Simulation:**

```yaml
resources:
  - name: config
    type: KeyValue
    file: ./data/config.properties
    separator: "="

connections:
  - name: api
    endpoint: "{R[config][baseUrl]}"
    listen: false

services:
  - steps:
      - direction: Out
        to: api
        message:
          method: GET
          headers:
            - key: Authorization
              value: "Bearer {R[config][apiKey]}"
```

### Table Resources (CSV)

Multi-column structured data:

**File: `data/books.csv`**

```csv
id,title,author,price,category
1,Book One,Author A,29.99,fiction
2,Book Two,Author B,34.99,non-fiction
3,Book Three,Author C,19.99,fiction
```

**Simulation:**

```yaml
resources:
  - name: books
    type: Table
    file: ./data/books.csv
    separator: ","
    properties:
      - id
      - title
      - author
      - price
      - category

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/books"
      - direction: Out
        message:
          payload: |-
            [
              {
                "id": "{R[books][0][id]}",
                "title": "{R[books][0][title]}",
                "author": "{R[books][0][author]}",
                "price": {R[books][0][price]}
              },
              {
                "id": "{R[books][1][id]}",
                "title": "{R[books][1][title]}",
                "author": "{R[books][1][author]}",
                "price": {R[books][1][price]}
              }
            ]
```

### Resource Properties

| Property             | Type   | Required | Description                              |
| -------------------- | ------ | -------- | ---------------------------------------- |
| `name`               | String | ✅       | Resource identifier                      |
| `type`               | String | ✅       | Value, KeyValue, or Table                |
| `file`               | String | ✅       | Path to data file (absolute or relative) |
| `separator`          | String | ⚠️ CSV   | Field separator (default: comma)         |
| `properties`         | Array  | ⚠️ Table | Column names if not in file              |
| `table`              | String | ❌       | Database table name (for DB resources)   |
| `listPrefix`         | String | ❌       | Prefix for list results                  |
| `listPostfix`        | String | ❌       | Postfix for list results                 |
| `listSeparator`      | String | ❌       | Separator between list items             |
| `listEntrySeparator` | String | ❌       | Separator between entry fields           |

### Resource Step Operations

You can also modify resources during simulation execution:

```yaml
steps:
  - direction: In
    resource:
      # Read from resource
      read:
        - ref: books
          where: "id = '123'"
          one: true

      # Insert into resource
      insert:
        - ref: books
          value:
            id: "456"
            title: "New Book"

      # Update resource
      update:
        - ref: books
          where: "id = '123'"
          value:
            title: "Updated Title"

      # Delete from resource
      delete:
        - ref: books
          where: "id = '123'"
```

---

## Templates

Templates allow you to define reusable components that can be referenced multiple times.

### Template Types

- **Connection Templates** - Reusable connection configurations
- **Message Templates** - Reusable message structures
- **Service Templates** - Reusable service steps

### Template Structure

```yaml
schema: SimV1
name: simulation-with-templates

templates:
  connections:
    - name: http-connection-template
      # ...connection config

  messages:
    - name: success-response-template
      # ...message config

  services:
    - name: crud-service-template
      # ...service steps

connections:
  - basedOn: http-connection-template
    name: my-connection
    endpoint: http://localhost:8000

services:
  - name: MyService
    steps:
      - use: crud-service-template
```

### Connection Templates

```yaml
templates:
  connections:
    - name: authenticated-http
      type: Http
      authentication: Basic
      username: admin
      password: secret
      headers:
        - key: X-API-Version
          value: "1.0"

connections:
  # Connection 1 uses template
  - basedOn: authenticated-http
    name: api-1
    endpoint: http://api1.example.com

  # Connection 2 uses template
  - basedOn: authenticated-http
    name: api-2
    endpoint: http://api2.example.com
```

### Message Templates

```yaml
templates:
  messages:
    - name: json-success-response
      statusCode: 200
      headers:
        - key: Content-Type
          value: application/json
      payload: |-
        {
          "status": "success",
          "timestamp": "{timestamp}"
        }

    - name: created-response
      statusCode: 201
      headers:
        - key: Content-Type
          value: application/json
        - key: Location
          value: "/api/resource/{randomGuid}"
      payload: |-
        {
          "id": "{randomGuid}",
          "created_at": "{timestamp}"
        }

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/health"
      - direction: Out
        message:
          basedOn: json-success-response # Use template

  - steps:
      - direction: In
        trigger:
          - uri: "/create"
      - direction: Out
        message:
          basedOn: created-response # Use template
```

### Service Templates

```yaml
templates:
  services:
    - name: get-request-pattern
      steps:
        - direction: In
          trigger:
            - method: "GET"
        - direction: Out
          message:
            statusCode: 200

connections:
  - name: api
    port: 8000

services:
  # Service 1 extends template
  - name: GetBooks
    use: get-request-pattern
    steps:
      - trigger:
          - uri: "/books"

  # Service 2 extends template
  - name: GetAuthors
    use: get-request-pattern
    steps:
      - trigger:
          - uri: "/authors"
```

---

## Includes

Import other simulation files to compose complex simulations.

### Basic Include

**File: `common-connections.yaml`**

```yaml
schema: SimV1
name: common-connections

connections:
  - name: bookstore-api
    endpoint: http://localhost:7002
    listen: false

  - name: llm-api
    endpoint: http://localhost:17070
    listen: false
```

**File: `main-simulation.yaml`**

```yaml
schema: SimV1
name: main-simulation

includes:
  - ./common-connections.yaml # Import connections

services:
  - steps:
      - direction: Out
        to: bookstore-api # Use imported connection
        message:
          method: GET
```

### Multiple Includes

```yaml
schema: SimV1
name: comprehensive-simulation

includes:
  - ./connections.yaml
  - ./templates.yaml
  - ./resources.yaml

services:
  # Use components from included files
  - steps:
      - direction: Out
        to: api-from-connections-file
        message:
          basedOn: message-from-templates-file
```

### Include Paths

- **Relative paths** - Relative to current file location

  ```yaml
  includes:
    - ./common/connections.yaml
    - ../shared/templates.yaml
  ```

- **Absolute paths** - Full file system path
  ```yaml
  includes:
    - /Users/username/simulations/common.yaml
    - C:\Simulations\shared.yaml
  ```

---

## Complete Examples

### Example 1: Data-Driven Book API

**File: `data/books.csv`**

```csv
id,title,author,isbn,price
1,The Great Gatsby,F. Scott Fitzgerald,9780743273565,12.99
2,1984,George Orwell,9780451524935,13.99
3,To Kill a Mockingbird,Harper Lee,9780061120084,14.99
```

**File: `book-api-simulation.yaml`**

```yaml
schema: SimV1
name: data-driven-book-api

resources:
  - name: books
    type: Table
    file: ./data/books.csv
    separator: ","

connections:
  - name: book-service
    port: 17777

services:
  - name: GetAllBooks
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
              {
                "id": "{R[books][0][id]}",
                "title": "{R[books][0][title]}",
                "author": "{R[books][0][author]}",
                "isbn": "{R[books][0][isbn]}",
                "price": {R[books][0][price]}
              },
              {
                "id": "{R[books][1][id]}",
                "title": "{R[books][1][title]}",
                "author": "{R[books][1][author]}",
                "isbn": "{R[books][1][isbn]}",
                "price": {R[books][1][price]}
              },
              {
                "id": "{R[books][2][id]}",
                "title": "{R[books][2][title]}",
                "author": "{R[books][2][author]}",
                "isbn": "{R[books][2][isbn]}",
                "price": {R[books][2][price]}
              }
            ]
```

### Example 2: Template-Based Multi-Environment

**File: `templates.yaml`**

```yaml
schema: SimV1
name: common-templates

templates:
  connections:
    - name: http-api-template
      type: Http
      authentication: Basic
      headers:
        - key: Content-Type
          value: application/json

  messages:
    - name: success-template
      statusCode: 200
      headers:
        - key: Content-Type
          value: application/json
```

**File: `dev-environment.yaml`**

```yaml
schema: SimV1
name: dev-environment

includes:
  - ./templates.yaml

connections:
  - basedOn: http-api-template
    name: dev-api
    endpoint: http://localhost:7002
    username: dev-user
    password: dev-pass

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/health"
      - direction: Out
        message:
          basedOn: success-template
          payload: '{"environment": "development"}'
```

**File: `prod-environment.yaml`**

```yaml
schema: SimV1
name: prod-environment

includes:
  - ./templates.yaml

connections:
  - basedOn: http-api-template
    name: prod-api
    endpoint: https://api.production.com
    username: prod-user
    password: prod-pass

services:
  - steps:
      - direction: In
        trigger:
          - uri: "/health"
      - direction: Out
        message:
          basedOn: success-template
          payload: '{"environment": "production"}'
```

---

## Common Mistakes

### ❌ Missing resource type

```yaml
resources:
  - name: books
    file: ./data/books.csv # ❌ Missing type
```

✅ Fix:

```yaml
resources:
  - name: books
    type: Table
    file: ./data/books.csv
```

### ❌ Wrong resource reference syntax

```yaml
payload: "{books}" # ❌ Missing R[] prefix
```

✅ Fix:

```yaml
payload: "{R[books]}"
```

### ❌ Circular includes

**File A:**

```yaml
includes:
  - ./fileB.yaml
```

**File B:**

```yaml
includes:
  - ./fileA.yaml # ❌ Circular reference
```

✅ Fix: Create a third file with shared components

---

## Next Steps

- **[07-RULES-VERIFICATION.md](./07-RULES-VERIFICATION.md)** - Use resources with rules
- **[09-ADVANCED-FEATURES.md](./09-ADVANCED-FEATURES.md)** - Combine with forwarding/learning
- **[QUICK-START.md](./QUICK-START.md)** - Basic examples without resources
