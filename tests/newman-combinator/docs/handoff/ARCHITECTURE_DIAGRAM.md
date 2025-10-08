# Newman Combinator - Architecture Diagram

## System Flow Visualization

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                          NEWMAN COMBINATOR FRAMEWORK                       │
│                         Multi-Combination API Testing                      │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              INPUT LAYER                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  📁 config/data-sets.json              📁 config/test-scenarios.json       │
│  ┌────────────────────────────┐        ┌─────────────────────────────┐     │
│  │ naughtyStrings: [          │        │ name: "llm-with-naughty"    │     │
│  │   { str: "", cat: "Null" } │        │ dimensions: [               │     │
│  │   { str: "null", ... }     │        │   "naughtyStrings"          │     │
│  │   { str: "<script>", ... } │        │ ]                           │     │
│  │   ... (51 total)           │        │ endpointTemplate:           │     │
│  │ ]                          │        │   "/api/v1/Books/{{str}}"   │     │
│  │                            │        │ method: "POST"              │     │
│  │ validBookIds: [            │        │ expectedResults: {          │     │
│  │   { id: "123", ... }       │        │   statusCode: [400,404,405] │     │
│  │ ]                          │        │ }                           │     │
│  └────────────────────────────┘        └─────────────────────────────┘     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Load Configs
                                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMBINATION ENGINE                                  │
│                      (src/combination-engine.js)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Load Data Sets                                                          │
│     ┌────────┐  ┌────────┐  ┌────────┐                                     │
│     │ Naughty│  │  ISBN  │  │ Error  │  ... data dimensions                │
│     │Strings │  │Formats │  │ Codes  │                                     │
│     └────────┘  └────────┘  └────────┘                                     │
│                                                                              │
│  2. Generate Cartesian Product                                              │
│     ┌───────────────────────────────────────────────────────┐              │
│     │  cartesianProduct([dim1, dim2, ...])                  │              │
│     │                                                        │              │
│     │  Example: ["A","B"] × ["1","2"] = [                  │              │
│     │    ["A","1"],                                        │              │
│     │    ["A","2"],                                        │              │
│     │    ["B","1"],                                        │              │
│     │    ["B","2"]                                         │              │
│     │  ]                                                    │              │
│     └───────────────────────────────────────────────────────┘              │
│                                                                              │
│  3. Apply Template Replacement                                              │
│     ┌───────────────────────────────────────────────────────┐              │
│     │  Template: "/api/v1/Books/{{naughtyString}}"          │              │
│     │  Data: { naughtyString: "null" }                      │              │
│     │  ────────────────────────────────────────────────────│              │
│     │  Result: "/api/v1/Books/null"                         │              │
│     └───────────────────────────────────────────────────────┘              │
│                                                                              │
│  4. Assign Test IDs                                                         │
│     llm-with-naughty-book-ids-0001                                          │
│     llm-with-naughty-book-ids-0002                                          │
│     ... (51 total)                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Combinations Ready
                                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TEST RUNNER                                       │
│                        (src/test-runner.js)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  For each combination:                                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │  1. Create Iteration Data                                    │           │
│  │     {                                                        │           │
│  │       testId: "llm-with-naughty-book-ids-0002",             │           │
│  │       endpoint: "/api/v1/Books/null/generate-summary",      │           │
│  │       method: "POST",                                        │           │
│  │       expectedStatusCode: [400, 404, 405]                   │           │
│  │     }                                                        │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                          │                                                   │
│                          ↓                                                   │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │  2. Execute via Newman                                       │           │
│  │     newman.run({                                             │           │
│  │       collection: "bookstore-combinator.json",              │           │
│  │       environment: envPath,                                  │           │
│  │       iterationData: [iteration]                             │           │
│  │     })                                                       │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                          │                                                   │
│                          ↓                                                   │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │  3. Capture Response                                         │           │
│  │     statusCode: 500                                          │           │
│  │     responseTime: 45ms                                       │           │
│  │     responseBody: '{"message":"Internal server error"}'     │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                          │                                                   │
│                          ↓                                                   │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │  4. Validate & Store                                         │           │
│  │     Expected: [400, 404, 405]                               │           │
│  │     Actual: 500                                              │           │
│  │     Result: ✗ FAIL - BUG FOUND!                             │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ Results Collected
                                       ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📄 JSON Results                       📊 Enhanced HTML Report              │
│  ┌────────────────────────┐            ┌──────────────────────────────┐    │
│  │ {                      │            │ ┌──────────────────────────┐ │    │
│  │   testId: "...-0002",  │            │ │  Combination Analytics   │ │    │
│  │   endpoint: "/Books/   │            │ │  ┌────────────────────┐  │ │    │
│  │     null/...",         │            │ │  │ Total: 51 tests    │  │ │    │
│  │   statusCode: 500,     │            │ │  │ Passed: 49        │  │ │    │
│  │   responseTime: 45,    │            │ │  │ Failed: 2         │  │ │    │
│  │   responseBody: "{...}"│            │ │  │ Pass Rate: 96%    │  │ │    │
│  │ }                      │            │ │  └────────────────────┘  │ │    │
│  └────────────────────────┘            │ └──────────────────────────┘ │    │
│                                        │                               │    │
│                                        │ ┌──────────────────────────┐ │    │
│                                        │ │   Naughty Strings        │ │    │
│                                        │ │       Heatmap            │ │    │
│                                        │ │  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐  │ │    │
│                                        │ │  │✓│✓│✗│✓│✓│✓│✓│✓│✓│✓│  │ │    │
│                                        │ │  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘  │ │    │
│                                        │ │  Empty XSS  SQL Unicode  │ │    │
│                                        │ └──────────────────────────┘ │    │
│                                        │                               │    │
│                                        │ ┌──────────────────────────┐ │    │
│                                        │ │   Test Results Table     │ │    │
│                                        │ │  ┌──┬────┬──────┬──────┐ │ │    │
│                                        │ │  │ID│Code│ Time │[View]│ │ │    │
│                                        │ │  ├──┼────┼──────┼──────┤ │ │    │
│                                        │ │  │02│500 │ 45ms │ [+] │ │ │    │
│                                        │ │  │  │    │      │ │   │ │ │    │
│                                        │ │  │  │    │      │ ↓   │ │ │    │
│                                        │ │  │  │    │      │{"m..│ │ │    │
│                                        │ │  └──┴────┴──────┴─────┘ │ │    │
│                                        │ └──────────────────────────┘ │    │
│                                        └──────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXPORT TOOL (NEW)                                   │
│                    (src/export-combinations.js)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔍 Preview Combinations BEFORE Running Tests                               │
│                                                                              │
│  $ node src/export-combinations.js --scenario llm-with-naughty-book-ids    │
│                                                                              │
│  Output:                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ ▶ Scenario: llm-with-naughty-book-ids                        │           │
│  │   Total Combinations: 51                                     │           │
│  │                                                              │           │
│  │   Sample Combinations:                                       │           │
│  │   1. /api/v1/Books//generate-summary (empty string)         │           │
│  │   2. /api/v1/Books/null/generate-summary                    │           │
│  │   3. /api/v1/Books/<script>.../generate-summary             │           │
│  │   ... (48 more)                                             │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  Formats:                                                                    │
│  • Console (default) - Pretty output                                        │
│  • JSON - Export to file for docs                                           │
│  • Markdown - Generate tables                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Dependencies

```text
┌───────────────────┐
│ CombinationEngine │
└─────────┬─────────┘
          │ uses
          ↓
┌───────────────────┐
│   Test Runner     │
└─────────┬─────────┘
          │ uses
          ↓
┌───────────────────┐
│      Newman       │◄─────────┐
└─────────┬─────────┘          │
          │ executes           │ uses
          ↓                    │
┌───────────────────┐          │
│ Postman Collection├──────────┘
└─────────┬─────────┘
          │ generates
          ↓
┌───────────────────┐
│   Test Results    │
└─────────┬─────────┘
          │ input to
          ↓
┌───────────────────┐
│  Report Generator │
└─────────┬─────────┘
          │ produces
          ↓
┌───────────────────┐
│    HTML Report    │
└───────────────────┘
```

## Data Flow

```text
Configuration Files → Combination Engine → Test Combinations
                                                    ↓
                                          Test Runner (Newman)
                                                    ↓
                                            Execute Tests
                                                    ↓
                                          Capture Responses
                                                    ↓
                                          Store Results (JSON)
                                                    ↓
                                          Generate Reports (HTML)
```

## Key Algorithms

### 1. Cartesian Product (Lines 36-46 in combination-engine.js)

```javascript
cartesianProduct(arrays) {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map(item => [item]);

  const [first, ...rest] = arrays;
  const restProduct = this.cartesianProduct(rest);

  return first.flatMap(firstItem =>
    restProduct.map(restItems => [firstItem, ...restItems])
  );
}

// Example:
// Input: [["A", "B"], ["1", "2"]]
// Output: [["A", "1"], ["A", "2"], ["B", "1"], ["B", "2"]]
```

### 2. Template Replacement (Lines 128-148 in combination-engine.js)

```javascript
applyTemplate(template, data) {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        const placeholder = new RegExp(`\\{\\{${nestedKey}\\}\\}`, 'g');
        result = result.replace(placeholder, nestedValue);
      }
    } else {
      // Handle simple values
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, value);
    }
  }

  return result;
}

// Example:
// template = "/api/v1/Books/{{bookId}}/summary"
// data = { validBookIds: { bookId: "123", description: "..." } }
// result = "/api/v1/Books/123/summary"
```

### 3. Response Capture (Lines 173-178 in test-runner.js)

```javascript
if (summary.run.executions.length > 0) {
  const execution = summary.run.executions[0];
  if (execution.response) {
    result.statusCode = execution.response.code;
    result.responseTime = execution.response.responseTime;
    result.responseBody = execution.response.stream?.toString(); // ← KEY LINE
  }
}
```

## File Relationships

```text
test-scenarios.json
        ↓ (defines)
    Scenario Config
        ↓ (references)
data-sets.json
        ↓ (provides)
    Test Data
        ↓ (combined by)
combination-engine.js
        ↓ (generates)
    Test Combinations
        ↓ (executed by)
test-runner.js
        ↓ (uses)
Postman Collection
        ↓ (produces)
    Results JSON
        ↓ (formatted by)
enhanced-report-generator.js
        ↓ (creates)
    HTML Report
```

## Execution Timeline

```text
T0: Load Configurations
    ├── data-sets.json
    ├── test-scenarios.json
    └── environments.json

T1: Generate Combinations
    ├── Extract data dimensions
    ├── Create Cartesian product
    └── Apply templates

T2: Execute Tests (for each combination)
    ├── Create iteration data
    ├── Run Newman
    ├── Capture response
    └── Validate results

T3: Aggregate Results
    ├── Collect all test results
    ├── Calculate summary stats
    └── Save to JSON

T4: Generate Report
    ├── Parse JSON results
    ├── Create analytics
    ├── Build HTML
    └── Open in browser
```

## Response Body Flow

```text
API Response
    ↓ (captured by)
execution.response.stream
    ↓ (converted to string)
result.responseBody
    ↓ (stored in)
JSON Results File
    ↓ (read by)
Report Generator
    ↓ (formatted as)
HTML <pre> tag
    ↓ (displayed via)
"View" Button Toggle
```

## Critical Success Path

```text
1. ✅ Config Files Valid
   └── data-sets.json has correct book IDs
   └── test-scenarios.json has correct endpoints
   └── environments.json has correct API URL

2. ✅ Combinations Generated
   └── Export tool shows expected count
   └── Templates replaced correctly
   └── No missing placeholders

3. ✅ Tests Execute
   └── Newman runs without errors
   └── Responses captured
   └── Status codes validated

4. ✅ Results Stored
   └── JSON file created
   └── Response bodies present
   └── All combinations tracked

5. ✅ Report Generated
   └── HTML displays correctly
   └── "View" buttons work
   └── Response bodies visible
```

## Error Handling Flow

```text
Invalid Config
    ↓
[Combination Engine]
    ↓ throws error
"Configuration not loaded"

Missing Data Dimension
    ↓
[Combination Engine]
    ↓ throws error
"Data set 'xxx' not found"

Template Mismatch
    ↓
[Combination Engine]
    ↓ returns
Endpoint with {{placeholder}} intact

Newman Failure
    ↓
[Test Runner]
    ↓ captures
execution.error
    ↓ stores
result.failures[]

Response Capture Failure
    ↓
[Test Runner]
    ↓ fallback
responseBody = "Unable to capture"
```

---

## Quick Reference: What Each File Does

| File                           | Purpose               | Key Function              |
| ------------------------------ | --------------------- | ------------------------- |
| `combination-engine.js`        | Generate combinations | `cartesianProduct()`      |
| `test-runner.js`               | Execute tests         | `runScenario()`           |
| `enhanced-report-generator.js` | Create HTML           | `buildEnhancedHTML()`     |
| `export-combinations.js`       | Preview combos        | `displayConsoleSummary()` |
| `data-sets.json`               | Test data             | 51 naughty strings        |
| `test-scenarios.json`          | Scenarios             | Endpoint templates        |
| `postman_collection.json`      | Test template         | Dynamic requests          |

---

**This diagram shows the complete architecture from config files to final HTML report.**
