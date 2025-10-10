# Tricentis API Simulator - External Data Files

Building complex test cases with external data sources

## Overview

External data files allow you to:

- **Separate test data from simulation logic** - Maintain data in CSV, JSON, or text files
- **Build data-driven test suites** - Run the same simulation with different datasets
- **Construct complex test scenarios** - Import sophisticated payloads and configurations
- **Collaborate efficiently** - Non-technical users can update test data without touching YAML

---

## Resources: The Foundation

Resources connect external files to your simulations using the `{R[resourceName]}` syntax.

### Resource Types

| Type       | File Format           | Use Case                                |
| ---------- | --------------------- | --------------------------------------- |
| `Table`    | CSV, TSV              | Structured multi-column test data       |
| `Value`    | Text (one per line)   | Simple lists (IDs, names, URLs)         |
| `KeyValue` | Properties (key=val)  | Configuration pairs, environment config |

---

## Table Resources (Recommended for Complex Test Cases)

**Best for:** Performance testing, contract testing, data-driven scenarios

### Basic Structure

```yaml
schema: SimV1
name: data-driven-simulation

resources:
  - name: testCases
    type: Table
    file: ./data/test-cases.csv
    separator: ","
    properties:
      - testId
      - inputPayload
      - expectedStatus
      - expectedResponse
```

### CSV File Example

**File: `data/test-cases.csv`**

```csv
testId,inputPayload,expectedStatus,expectedResponse
TC001,"{""query"":""hello""}",200,"{""result"":""success""}"
TC002,"{""query"":""error""}",400,"{""error"":""bad request""}"
TC003,"{""query"":""timeout""}",504,"{""error"":""timeout""}"
```

### Using Table Data in Simulations

```yaml
services:
  - name: TestCase001
    description: Test case from CSV row 0
    steps:
      - direction: In
        trigger:
          - uri: "/test/TC001"
      - direction: Out
        message:
          statusCode: "{R[testCases][0][expectedStatus]}"
          payload: "{R[testCases][0][expectedResponse]}"

  - name: TestCase002
    description: Test case from CSV row 1
    steps:
      - direction: In
        trigger:
          - uri: "/test/TC002"
      - direction: Out
        message:
          statusCode: "{R[testCases][1][expectedStatus]}"
          payload: "{R[testCases][1][expectedResponse]}"
```

### Reference Syntax

| Syntax                             | Description                 | Example Value           |
| ---------------------------------- | --------------------------- | ----------------------- |
| `{R[resourceName]}`                | Entire resource as JSON     | `[{...}, {...}]`        |
| `{R[resourceName][0]}`             | First row as JSON           | `{testId: "TC001", ...}`|
| `{R[resourceName][0][columnName]}` | Specific cell value         | `"TC001"`               |
| `{R[resourceName][*][columnName]}` | All values from one column  | `["TC001", "TC002"]`    |

---

## Complete Example: Performance Test Data

### Scenario: Testing LLM API with Various Payloads

**File: `data/llm-test-cases.csv`**

```csv
scenarioId,model,systemPrompt,userMessage,maxTokens,temperature,expectedTokenCount
perf-small,claude-3-haiku-20240307,You are a helpful assistant,Hello,100,0.7,50
perf-medium,claude-3-5-sonnet-20241022,You are a code reviewer,Review this code: function test() {},500,0.5,300
perf-large,claude-3-opus-20240229,Analyze this dataset,"""Dataset: [1,2,3,4,5]""",1000,1.0,800
stream-test,claude-3-5-sonnet-20241022,Stream response,Tell me a story,2000,0.9,1500
```

**File: `Definitions/llm-performance-tests.yaml`**

```yaml
schema: SimV1
name: llm-performance-tests

resources:
  - name: perfTests
    type: Table
    file: ./data/llm-test-cases.csv
    separator: ","
    properties:
      - scenarioId
      - model
      - systemPrompt
      - userMessage
      - maxTokens
      - temperature
      - expectedTokenCount

connections:
  - name: mock-llm
    port: 17070

services:
  - name: SmallPayloadTest
    description: "{R[perfTests][0][scenarioId]}"
    steps:
      - direction: In
        trigger:
          - uri: "/v1/messages"
          - method: "POST"
          - jsonPath: "$.model"
            value: "{R[perfTests][0][model]}"

      - direction: Out
        message:
          statusCode: 200
          delay: 500
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
                  "text": "Response for scenario: {R[perfTests][0][scenarioId]}"
                }
              ],
              "model": "{R[perfTests][0][model]}",
              "usage": {
                "input_tokens": 25,
                "output_tokens": {R[perfTests][0][expectedTokenCount]}
              }
            }

  - name: MediumPayloadTest
    description: "{R[perfTests][1][scenarioId]}"
    steps:
      - direction: In
        trigger:
          - uri: "/v1/messages"
          - method: "POST"
          - jsonPath: "$.model"
            value: "{R[perfTests][1][model]}"

      - direction: Out
        message:
          statusCode: 200
          delay: 1500
          payload: |-
            {
              "id": "msg_{randomGuid}",
              "type": "message",
              "role": "assistant",
              "content": [
                {
                  "type": "text",
                  "text": "Response for scenario: {R[perfTests][1][scenarioId]}"
                }
              ],
              "model": "{R[perfTests][1][model]}",
              "usage": {
                "input_tokens": 100,
                "output_tokens": {R[perfTests][1][expectedTokenCount]}
              }
            }
```

---

## Value Resources

**Best for:** Simple lists of IDs, test identifiers, or single-value datasets

### Example: Book IDs for Sequential Testing

**File: `data/book-ids.txt`**

```text
68dedb16887eae6ff6743f51
68e05e77604bb44693ad8e92
68e05e7d604bb44693ad8e93
68e05e8a604bb44693ad8e94
68e05e90604bb44693ad8e95
```

**Simulation:**

```yaml
schema: SimV1
name: book-lookup-tests

resources:
  - name: bookIds
    type: Value
    file: ./data/book-ids.txt

connections:
  - name: bookstore-api
    endpoint: http://localhost:7002
    listen: false

services:
  - name: TestBook1
    steps:
      - direction: Out
        to: bookstore-api
        message:
          method: GET
        insert:
          - type: Path
            value: "/api/v1/Books/{R[bookIds][0]}"

      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK

  - name: TestBook2
    steps:
      - direction: Out
        to: bookstore-api
        message:
          method: GET
        insert:
          - type: Path
            value: "/api/v1/Books/{R[bookIds][1]}"

      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
```

---

## KeyValue Resources

**Best for:** Configuration management, environment-specific settings, API credentials

### Example: Multi-Environment Configuration

**File: `data/environments/dev-config.properties`**

```text
apiBaseUrl=http://localhost:7002
apiKey=dev-test-key-12345
timeout=5000
maxRetries=3
mockMode=true
```

**File: `data/environments/prod-config.properties`**

```text
apiBaseUrl=https://api.production.com
apiKey=prod-key-67890
timeout=10000
maxRetries=5
mockMode=false
```

**Simulation:**

```yaml
schema: SimV1
name: environment-aware-tests

resources:
  - name: config
    type: KeyValue
    file: ./data/environments/dev-config.properties
    separator: "="

connections:
  - name: target-api
    endpoint: "{R[config][apiBaseUrl]}"
    listen: false

services:
  - name: AuthenticatedRequest
    steps:
      - direction: Out
        to: target-api
        message:
          method: GET
          headers:
            - key: Authorization
              value: "Bearer {R[config][apiKey]}"
            - key: X-Timeout
              value: "{R[config][timeout]}"
        insert:
          - type: Path
            value: /api/v1/Books

      - direction: In
        verify:
          - property: StatusCode
            value: 200 OK
```

---

## Advanced Pattern: Complex JSON Payloads

For truly complex test cases, store JSON payloads in CSV cells.

### Example: Embedding Full JSON in CSV

**File: `data/complex-requests.csv`**

```csv
testName,requestBody,expectedResponse
CreateBook,"{""title"":""The Great Gatsby"",""author"":""F. Scott Fitzgerald"",""isbn"":""978-0-7432-7356-5"",""price"":12.99,""categories"":[""fiction"",""classic""]}","{""id"":""{randomGuid}"",""status"":""created""}"
CreateAuthor,"{""name"":""George Orwell"",""birthYear"":1903,""nationality"":""British"",""books"":[""1984"",""Animal Farm""]}","{""id"":""{randomGuid}"",""status"":""created""}"
```

**Simulation:**

```yaml
resources:
  - name: complexTests
    type: Table
    file: ./data/complex-requests.csv
    separator: ","

services:
  - name: ComplexCreateBook
    steps:
      - direction: In
        trigger:
          - uri: "/complex/test1"
      - direction: Out
        message:
          statusCode: 201
          payload: "{R[complexTests][0][expectedResponse]}"

  - name: ComplexCreateAuthor
    steps:
      - direction: In
        trigger:
          - uri: "/complex/test2"
      - direction: Out
        message:
          statusCode: 201
          payload: "{R[complexTests][1][expectedResponse]}"
```

---

## Combining Resources with Contract Tests

Test real APIs using external test case definitions.

**File: `data/api-contract-tests.csv`**

```csv
testId,endpoint,method,expectedStatus,requiredJsonPath
TC001,/api/v1/Books,GET,200,$[0].id
TC002,/api/v1/Books,GET,200,$[0].title
TC003,/api/v1/Books/123,GET,200,$.id
TC004,/api/v1/Books/invalid,GET,404,$.error
```

**Simulation:**

```yaml
schema: SimV1
name: contract-test-suite

resources:
  - name: contractTests
    type: Table
    file: ./data/api-contract-tests.csv

connections:
  - name: api-under-test
    endpoint: http://localhost:7002
    listen: false

services:
  - name: ContractTest_TC001
    description: "{R[contractTests][0][testId]} - {R[contractTests][0][endpoint]}"
    steps:
      - direction: Out
        to: api-under-test
        message:
          method: "{R[contractTests][0][method]}"
        insert:
          - type: Path
            value: "{R[contractTests][0][endpoint]}"

      - direction: In
        verify:
          - property: StatusCode
            value: "{R[contractTests][0][expectedStatus]} OK"
          - jsonPath: "{R[contractTests][0][requiredJsonPath]}"
            exists: true

  - name: ContractTest_TC002
    description: "{R[contractTests][1][testId]} - {R[contractTests][1][endpoint]}"
    steps:
      - direction: Out
        to: api-under-test
        message:
          method: "{R[contractTests][1][method]}"
        insert:
          - type: Path
            value: "{R[contractTests][1][endpoint]}"

      - direction: In
        verify:
          - property: StatusCode
            value: "{R[contractTests][1][expectedStatus]} OK"
          - jsonPath: "{R[contractTests][1][requiredJsonPath]}"
            exists: true
```

---

## Resource Properties Reference

### Common Properties (All Types)

| Property    | Type   | Required | Description                              |
| ----------- | ------ | -------- | ---------------------------------------- |
| `name`      | String | ✅       | Unique resource identifier               |
| `type`      | String | ✅       | Value, KeyValue, or Table                |
| `file`      | String | ✅       | Path to file (relative or absolute)      |
| `separator` | String | ⚠️       | Field delimiter (default: comma)         |

### Table-Specific Properties

| Property     | Type  | Required | Description                    |
| ------------ | ----- | -------- | ------------------------------ |
| `properties` | Array | ⚠️       | Column names (if not in file)  |

### Path Resolution

```yaml
# Relative to YAML file location
file: ./data/test-cases.csv

# Relative to parent directory
file: ../shared-data/common-tests.csv

# Absolute path
file: /Users/username/test-data/cases.csv
```

---

## Performance Testing Best Practices

### 1. Organize by Test Type

```yaml
data/
├── smoke/
│   ├── basic-health-checks.csv
│   └── quick-validations.csv
├── load/
│   ├── sustained-load-scenarios.csv
│   └── concurrent-users.csv
├── stress/
│   ├── high-volume-requests.csv
│   └── edge-cases.csv
└── spike/
    ├── traffic-bursts.csv
    └── peak-scenarios.csv
```

### 2. Use Descriptive Column Names

```csv
scenarioId,requestType,payloadSize,expectedLatencyMs,expectedStatusCode,notes
```

### 3. Include Metadata in CSV

```csv
testId,category,priority,author,createdDate,inputPayload,expectedOutput
TC001,smoke,high,jsmith,2025-10-01,{...},{...}
```

### 4. Version Your Test Data

```yaml
data/
├── v1/
│   └── test-cases.csv
├── v2/
│   └── test-cases.csv
└── current -> v2/
```

---

## Common Mistakes

### ❌ Missing Resource Type

```yaml
resources:
  - name: testData
    file: ./data/tests.csv  # ❌ Missing type property
```

✅ **Fix:**

```yaml
resources:
  - name: testData
    type: Table
    file: ./data/tests.csv
```

### ❌ Wrong Reference Syntax

```yaml
# ❌ Missing R[] wrapper
payload: "{testData[0][field]}"

# ❌ Wrong bracket type
payload: "{R(testData)(0)(field)}"
```

✅ **Fix:**

```yaml
payload: "{R[testData][0][field]}"
```

### ❌ CSV Escaping Issues

```csv
# ❌ Unescaped quotes in JSON
testId,payload
TC001,{"key":"value"}
```

✅ **Fix:**

```csv
# Use doubled quotes for CSV escaping
testId,payload
TC001,"{""key"":""value""}"
```

### ❌ Incorrect File Path

```yaml
resources:
  - name: tests
    type: Table
    file: data/tests.csv  # ❌ Missing ./
```

✅ **Fix:**

```yaml
resources:
  - name: tests
    type: Table
    file: ./data/tests.csv  # Relative to YAML file
```

### ❌ Accessing Non-Existent Row

```yaml
# CSV has only 3 rows (indices 0, 1, 2)
payload: "{R[tests][5][field]}"  # ❌ Index out of bounds
```

✅ **Fix:** Check your CSV row count and use valid indices.

---

## Debugging Tips

### 1. Test Resource Loading

Create a simple service that returns the entire resource:

```yaml
services:
  - name: DebugResource
    steps:
      - direction: In
        trigger:
          - uri: "/debug/resource"
      - direction: Out
        message:
          statusCode: 200
          payload: "{R[testCases]}"
```

Call `GET /debug/resource` to see how the resource was parsed.

### 2. Validate CSV Format

- Ensure consistent column count across all rows
- Escape quotes properly (`""` inside CSV cells)
- Use UTF-8 encoding
- Verify separator matches `separator` property

### 3. Check File Permissions

```bash
# Ensure file is readable
ls -la data/test-cases.csv

# Verify file exists
cat data/test-cases.csv
```

### 4. Enable Simulator Logging

Check simulator logs for resource loading errors:

```text
[INFO] Loading resource: testCases from ./data/test-cases.csv
[ERROR] Failed to load resource: File not found
```

---

## Combining with Other Features

### With Templates

```yaml
resources:
  - name: apiConfig
    type: KeyValue
    file: ./data/config.properties

templates:
  connections:
    - name: api-template
      endpoint: "{R[apiConfig][baseUrl]}"
      headers:
        - key: Authorization
          value: "Bearer {R[apiConfig][apiKey]}"

connections:
  - basedOn: api-template
    name: my-api
```

### With Buffering

```yaml
resources:
  - name: testCases
    type: Table
    file: ./data/cases.csv

services:
  - steps:
      - direction: In
        buffer:
          - bufferName: testId
            jsonPath: $.id

      - direction: Out
        message:
          payload: |-
            {
              "testId": "{B[testId]}",
              "expectedResult": "{R[testCases][0][expected]}"
            }
```

### With Includes

**File: `common-resources.yaml`**

```yaml
schema: SimV1
name: shared-resources

resources:
  - name: sharedTestData
    type: Table
    file: ./data/shared-tests.csv
```

**File: `main-simulation.yaml`**

```yaml
schema: SimV1
name: main-simulation

includes:
  - ./common-resources.yaml

services:
  - steps:
      - direction: Out
        message:
          payload: "{R[sharedTestData][0][data]}"
```

---

## Real-World Example: K6 Performance Testing

Generate test data for k6 scenarios using the API Simulator.

**File: `data/k6-load-scenarios.csv`**

```csv
virtualUsers,duration,rampUpTime,requestsPerSecond,targetEndpoint
10,60s,10s,5,/api/v1/Books
50,120s,20s,25,/api/v1/Books
100,300s,30s,50,/api/v1/Books
```

**File: `Definitions/k6-load-test-endpoints.yaml`**

```yaml
schema: SimV1
name: k6-performance-endpoints

resources:
  - name: loadScenarios
    type: Table
    file: ./data/k6-load-scenarios.csv

connections:
  - name: perf-test-api
    port: 18080

services:
  - name: LowLoad
    description: "VUs: {R[loadScenarios][0][virtualUsers]}, Duration: {R[loadScenarios][0][duration]}"
    steps:
      - direction: In
        trigger:
          - uri: "/load/low"
      - direction: Out
        message:
          statusCode: 200
          payload: |-
            {
              "scenario": "low-load",
              "config": {
                "virtualUsers": {R[loadScenarios][0][virtualUsers]},
                "duration": "{R[loadScenarios][0][duration]}",
                "rps": {R[loadScenarios][0][requestsPerSecond]}
              }
            }

  - name: MediumLoad
    description: "VUs: {R[loadScenarios][1][virtualUsers]}, Duration: {R[loadScenarios][1][duration]}"
    steps:
      - direction: In
        trigger:
          - uri: "/load/medium"
      - direction: Out
        message:
          statusCode: 200
          payload: |-
            {
              "scenario": "medium-load",
              "config": {
                "virtualUsers": {R[loadScenarios][1][virtualUsers]},
                "duration": "{R[loadScenarios][1][duration]}",
                "rps": {R[loadScenarios][1][requestsPerSecond]}
              }
            }
```

---

## Next Steps

- **[08-RESOURCES-TEMPLATES.md](./08-RESOURCES-TEMPLATES.md)** - Full resources documentation
- **[07-RULES-VERIFICATION.md](./07-RULES-VERIFICATION.md)** - Use resources with verification
- **[09-ADVANCED-FEATURES.md](./09-ADVANCED-FEATURES.md)** - Combine with learning mode
- **[QUICK-START.md](./QUICK-START.md)** - Basic examples without resources

## Summary

External data files enable:

✅ **Separation of concerns** - Test logic vs test data
✅ **Easy collaboration** - Non-developers can update CSV files
✅ **Complex scenarios** - Import sophisticated payloads and configurations
✅ **Data-driven testing** - Run same tests with different datasets
✅ **Maintainability** - Update test data without touching YAML
✅ **Performance testing** - Define load scenarios in spreadsheets

**Pro Tip:** Start with simple CSV files and gradually add complexity as needed. Use Excel or Google Sheets to manage test data, then export to CSV.
