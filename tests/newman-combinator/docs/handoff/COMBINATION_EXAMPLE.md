# Combination Logic - Quick Visual Example

## How It Works: Step-by-Step

### Step 1: Define Test Scenario

```javascript
// In config/test-scenarios.json
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

### Step 2: Load Test Data

```javascript
// In config/data-sets.json
{
  "naughtyStrings": [
    { "naughtyString": "", "category": "Empty/Null" },
    { "naughtyString": "null", "category": "Empty/Null" },
    { "naughtyString": "<script>alert('XSS')</script>", "category": "XSS" },
    { "naughtyString": "'; DROP TABLE books;--", "category": "SQL Injection" },
    // ... 47 more
  ]
}
```

### Step 3: Generate Combinations (Cartesian Product)

**Formula:** 1 dimension with 51 values = 51 combinations

```text
naughtyStrings[0] → Combination 1
naughtyStrings[1] → Combination 2
naughtyStrings[2] → Combination 3
...
naughtyStrings[50] → Combination 51
```

### Step 4: Apply Template Replacement

```javascript
// Original Template
"/api/v1/Books/{{naughtyString}}/generate-summary?provider=ollama";

// Combination 1: naughtyString = ""
"/api/v1/Books//generate-summary?provider=ollama";

// Combination 2: naughtyString = "null"
"/api/v1/Books/null/generate-summary?provider=ollama";

// Combination 3: naughtyString = "<script>alert('XSS')</script>"
"/api/v1/Books/<script>alert('XSS')</script>/generate-summary?provider=ollama";
```

### Step 5: Execute Tests

```bash
# Test 1: Empty string
POST /api/v1/Books//generate-summary?provider=ollama
Expected: [400, 404, 405]
Actual: 404
✓ PASS

# Test 2: String "null"
POST /api/v1/Books/null/generate-summary?provider=ollama
Expected: [400, 404, 405]
Actual: 500 (Internal Server Error)
✗ FAIL - Found API bug!

# Test 3: XSS attempt
POST /api/v1/Books/<script>alert('XSS')</script>/generate-summary?provider=ollama
Expected: [400, 404, 405]
Actual: 400
✓ PASS
```

### Step 6: Store Response for Validation

```json
{
  "testId": "llm-with-naughty-book-ids-0002",
  "endpoint": "/api/v1/Books/null/generate-summary?provider=ollama",
  "statusCode": 500,
  "responseBody": "{\"message\":\"Internal server error\"}"
}
```

## Multi-Dimensional Example

### Scenario: Cross-Product of 2 Dimensions

```javascript
// Dimensions
{
  "isbnFormats": [
    { "isbn": "978-0-123456-78-9" },
    { "isbn": "9780123456789" }
  ],
  "bookEndpoints": [
    { "endpoint": "search" },
    { "endpoint": "by-isbn" },
    { "endpoint": "validate-isbn" }
  ]
}

// Template
"/api/v1/books/{{endpoint}}?isbn={{isbn}}"
```

### Cartesian Product Calculation

```text
2 ISBNs × 3 Endpoints = 6 Combinations

ISBN[0] × Endpoint[0] → /api/v1/books/search?isbn=978-0-123456-78-9
ISBN[0] × Endpoint[1] → /api/v1/books/by-isbn?isbn=978-0-123456-78-9
ISBN[0] × Endpoint[2] → /api/v1/books/validate-isbn?isbn=978-0-123456-78-9
ISBN[1] × Endpoint[0] → /api/v1/books/search?isbn=9780123456789
ISBN[1] × Endpoint[1] → /api/v1/books/by-isbn?isbn=9780123456789
ISBN[1] × Endpoint[2] → /api/v1/books/validate-isbn?isbn=9780123456789
```

## How Errors Are Handled

### Scenario: Error Code Testing

```javascript
// Dimensions
{
  "errorCodes": ["400", "401", "404", "500"],
  "httpMethods": ["GET", "POST", "PUT"]
}

// Template
"/api/v1/ErrorTest/{{errorCode}}"
// Method: "{{httpMethod}}"
```

### Combinations Generated

```text
4 Error Codes × 3 HTTP Methods = 12 Combinations

GET  /api/v1/ErrorTest/400 → Expect 400
POST /api/v1/ErrorTest/400 → Expect 400
PUT  /api/v1/ErrorTest/400 → Expect 400
GET  /api/v1/ErrorTest/401 → Expect 401
POST /api/v1/ErrorTest/401 → Expect 401
PUT  /api/v1/ErrorTest/401 → Expect 401
GET  /api/v1/ErrorTest/404 → Expect 404
POST /api/v1/ErrorTest/404 → Expect 404
PUT  /api/v1/ErrorTest/404 → Expect 404
GET  /api/v1/ErrorTest/500 → Expect 500
POST /api/v1/ErrorTest/500 → Expect 500
PUT  /api/v1/ErrorTest/500 → Expect 500
```

## Summary

| Scenario                     | Dimensions               | Values | Total Combinations |
| ---------------------------- | ------------------------ | ------ | ------------------ |
| **LLM with valid books**     | validBookIds             | 3      | **3**              |
| **LLM with naughty strings** | naughtyStrings           | 51     | **51**             |
| **ISBN testing**             | isbnFormats × endpoints  | 10 × 3 | **30**             |
| **Error scenarios**          | errorCodes × httpMethods | 14 × 5 | **70**             |

**Key Insight:** The framework automatically generates hundreds of test cases from simple configuration files using Cartesian product logic!

## Commands to Explore Combinations

```bash
# List all scenarios
make combinator-export

# View specific scenario combinations
make combinator-export SCENARIO=llm-with-naughty-book-ids

# Export to JSON
make combinator-export-json SCENARIO=llm-summary-with-ollama FILE=combos.json

# Export all scenarios
make combinator-export-all
```
