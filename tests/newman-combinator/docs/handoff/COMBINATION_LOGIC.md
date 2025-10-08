# Newman Combinator - Combination Logic Explained

## How Combinations Work

The Newman Combinator framework uses **Cartesian Product** logic to generate test combinations. This means it creates every possible combination of test inputs across multiple dimensions.

### Simple Example: Single Dimension

**Scenario:** `llm-summary-with-ollama`

**Input Data:**

- Dimension: `validBookIds`
- Values: 3 book IDs

**Result:** 3 combinations (1 test per book)

```
Combination 1: Book "The Great Gatsby" (68e05e77604bb44693ad8e92)
Combination 2: Book "To Kill a Mockingbird" (68e05e7d604bb44693ad8e93)
Combination 3: Book "1984" (68e05e7d604bb44693ad8e94)
```

### Complex Example: Multi-Dimensional (Cartesian Product)

**Scenario:** `book-isbn-combinations`

**Input Data:**

- Dimension 1: `isbnFormats` → 10 different ISBN formats
- Dimension 2: `bookEndpoints` → 3 endpoints (search, by-isbn, validate-isbn)

**Cartesian Product Formula:**

```
Total Combinations = Dimension1 × Dimension2
                   = 10 ISBNs × 3 endpoints
                   = 30 combinations
```

**Generated Combinations:**

```
1. ISBN "978-0-123456-78-9" + endpoint "search"
2. ISBN "978-0-123456-78-9" + endpoint "by-isbn"
3. ISBN "978-0-123456-78-9" + endpoint "validate-isbn"
4. ISBN "9780123456789" + endpoint "search"
5. ISBN "9780123456789" + endpoint "by-isbn"
... (30 total)
```

## How Naughty Strings Are Applied

**Scenario:** `llm-with-naughty-book-ids`

**Config:**

```json
{
  "name": "llm-with-naughty-book-ids",
  "dataDimensions": ["naughtyStrings"],
  "endpointTemplate": "/api/v1/Books/{{naughtyString}}/generate-summary?provider=ollama",
  "method": "POST",
  "expectedResults": {
    "statusCode": [400, 404, 405]
  }
}
```

**Process:**

1. **Load Naughty Strings** from `data-sets.json`:

   ```json
   {
     "naughtyStrings": [
       { "naughtyString": "", "category": "Empty/Null" },
       { "naughtyString": "null", "category": "Empty/Null" },
       { "naughtyString": "<script>alert('XSS')</script>", "category": "XSS" },
       ... (51 total)
     ]
   }
   ```

2. **Generate One Combination Per Naughty String**:
   - Combination 1: Empty string `""` → `/api/v1/Books//generate-summary?provider=ollama`
   - Combination 2: String "null" → `/api/v1/Books/null/generate-summary?provider=ollama`
   - Combination 3: XSS payload → `/api/v1/Books/<script>alert('XSS')</script>/generate-summary?provider=ollama`
   - ... (51 total combinations)

3. **Template Replacement**:

   ```javascript
   // Original template
   "/api/v1/Books/{{naughtyString}}/generate-summary?provider=ollama";

   // After replacement with "null"
   "/api/v1/Books/null/generate-summary?provider=ollama";
   ```

4. **Execute Test**:
   ```bash
   POST /api/v1/Books/null/generate-summary?provider=ollama
   Expected: 400, 404, or 405
   Actual: 500 (Server Error - BUG FOUND!)
   ```

## Error Handling Combinations

**Scenario:** `comprehensive-error-scenarios`

**Config:**

```json
{
  "dataDimensions": ["errorCodes", "httpMethods"],
  "endpointTemplate": "/api/v1/ErrorTest/{{errorCode}}",
  "method": "{{httpMethod}}"
}
```

**Data:**

- `errorCodes`: [400, 401, 404, 500, ...] → 14 codes
- `httpMethods`: [GET, POST, PUT, DELETE, PATCH] → 5 methods

**Cartesian Product:**

```
Total = 14 error codes × 5 HTTP methods = 70 combinations

Examples:
1. GET /api/v1/ErrorTest/400 (expect 400)
2. POST /api/v1/ErrorTest/400 (expect 400)
3. PUT /api/v1/ErrorTest/400 (expect 400)
4. DELETE /api/v1/ErrorTest/400 (expect 400)
5. PATCH /api/v1/ErrorTest/400 (expect 400)
6. GET /api/v1/ErrorTest/401 (expect 401)
... (70 total)
```

## Template Replacement Logic

The framework supports nested object properties:

### Simple Value Replacement:

```javascript
// Template
"/api/v1/Books/{{bookId}}"

// Data
{ "bookId": "12345" }

// Result
"/api/v1/Books/12345"
```

### Nested Object Replacement:

```javascript
// Template
"/api/v1/Books/{{bookId}}/generate-summary?provider=ollama"

// Data (nested object)
{
  "validBookIds": {
    "bookId": "68e05e77604bb44693ad8e92",
    "description": "The Great Gatsby",
    "valid": true
  }
}

// Replacement Process:
// 1. Extract nested "bookId" property
// 2. Replace {{bookId}} with "68e05e77604bb44693ad8e92"

// Result
"/api/v1/Books/68e05e77604bb44693ad8e92/generate-summary?provider=ollama"
```

## Combination Validation

Each combination includes:

1. **Test ID**: Unique identifier (`llm-with-naughty-book-ids-0023`)
2. **Endpoint**: Full URL path after template replacement
3. **Method**: HTTP method (GET, POST, PUT, DELETE, PATCH)
4. **Data**: Original input values with metadata
5. **Expected Results**: Status codes to validate against
6. **Response Body**: Captured API response (stored for validation)

### Example Combination Structure:

```json
{
  "testId": "llm-with-naughty-book-ids-0023",
  "scenario": "llm-with-naughty-book-ids",
  "description": "Test LLM endpoint with naughty strings as book IDs",
  "data": {
    "naughtyStrings": {
      "naughtyString": "'; DROP TABLE books;--",
      "category": "SQL Injection",
      "description": "SQL injection attempt"
    }
  },
  "endpoint": "/api/v1/Books/'; DROP TABLE books;--/generate-summary?provider=ollama",
  "method": "POST",
  "expected": {
    "statusCode": [400, 404, 405]
  },
  "statusCode": 404,
  "responseTime": 45,
  "responseBody": "{\"message\":\"Book not found\"}"
}
```

## How to View Combinations

### Console Output (Quick View):

```bash
node src/export-combinations.js --scenario llm-with-naughty-book-ids
```

### JSON Export (Full Data):

```bash
node src/export-combinations.js --scenario llm-with-naughty-book-ids --format json --output combinations.json
```

### Markdown Export (Documentation):

```bash
node src/export-combinations.js --all --format md --output combinations.md
```

### List All Scenarios:

```bash
node src/export-combinations.js
```

## Key Insights

### 1. **Single Dimension = Simple Loop**

- `validBookIds` (3 items) → 3 tests
- `naughtyStrings` (51 items) → 51 tests

### 2. **Multiple Dimensions = Cartesian Product**

- `isbnFormats` (10) × `bookEndpoints` (3) → 30 tests
- `errorCodes` (14) × `httpMethods` (5) → 70 tests

### 3. **Template Variables Are Replaced Dynamically**

- `{{bookId}}` → Replaced with actual book ID
- `{{naughtyString}}` → Replaced with naughty string value
- `{{errorCode}}` → Replaced with error code number

### 4. **Expected Results Define Validation**

- `statusCode: [200, 404]` → Test passes if response is 200 OR 404
- `statusCode: 500` → Test passes only if response is exactly 500

### 5. **Response Bodies Enable Deep Validation**

- Stored in results JSON
- Displayed in HTML reports with "View" buttons
- Can validate response structure, error messages, LLM-generated content

## Common Scenarios

| Scenario Name                   | Dimensions                           | Formula | Total Tests |
| ------------------------------- | ------------------------------------ | ------- | ----------- |
| `llm-summary-with-ollama`       | validBookIds (3)                     | 3       | 3           |
| `llm-with-naughty-book-ids`     | naughtyStrings (51)                  | 51      | 51          |
| `book-isbn-combinations`        | isbnFormats (10) × bookEndpoints (3) | 10 × 3  | 30          |
| `comprehensive-error-scenarios` | errorCodes (14) × httpMethods (5)    | 14 × 5  | 70          |
| `mixed-payload-attacks`         | payloadTypes (8) × targetFields (4)  | 8 × 4   | 32          |

## Summary

The combination engine:

1. ✅ **Loads** test scenarios and data sets from config files
2. ✅ **Generates** Cartesian product of all data dimensions
3. ✅ **Replaces** template placeholders with actual values
4. ✅ **Assigns** unique test IDs and expected results
5. ✅ **Executes** tests via Newman/Postman
6. ✅ **Captures** response bodies for validation
7. ✅ **Reports** results in JSON and HTML formats

This approach enables **comprehensive API testing** by automatically generating hundreds of test cases from simple configuration files.
