# Tricentis API Simulator - Troubleshooting

**Common issues, debugging techniques, and solutions**

## Quick Diagnostics

### Check Simulator Status

```bash
# Check if simulator is running
curl http://localhost:28880/api/agent/settings

# Expected: JSON response with simulator configuration
# If connection refused: Simulator not running
```

### Check Simulation Loaded

```bash
# View loaded simulations via UI
open http://localhost:28880/ui/

# Or via API
curl http://localhost:28880/api/simulations
```

### Check Port Availability

```bash
# macOS/Linux
lsof -i :17070  # Check if port 17070 is in use

# Expected: Shows process using port
# If empty: Port is free
```

---

## Common Errors

### Error 1: "Configuration not found"

**Symptom:**
```
Error: Could not find configuration file at path: /path/to/file.yaml
```

**Causes:**
- File path is incorrect (relative vs absolute)
- File doesn't exist
- File has wrong extension (.yml vs .yaml)

**Solutions:**

```bash
# Check file exists
ls -la BookStore.Simulator/Definitions/

# Verify file path in configuration
cat BookStore.Aspire.AppHost/appsettings.json | grep SimulationFiles

# Use absolute paths if relative paths fail
```

✅ **Fix:** Verify file path and ensure file exists

---

### Error 2: "Schema validation failed"

**Symptom:**
```
Error: Invalid schema. Expected 'SimV1', got 'undefined'
```

**Cause:** Missing or incorrect `schema` declaration

**Solution:**

❌ Wrong:
```yaml
name: my-simulation  # Missing schema
```

✅ Fix:
```yaml
schema: SimV1
name: my-simulation
```

---

### Error 3: "Connection refused" (Port not listening)

**Symptom:**
```bash
curl http://localhost:17070/v1/messages
# curl: (7) Failed to connect to localhost port 17070: Connection refused
```

**Causes:**
- Simulator not running
- Port specified incorrectly in YAML
- Port already in use by another process

**Solutions:**

```bash
# 1. Check simulator is running
curl http://localhost:28880/api/agent/settings

# 2. Check port in YAML
grep -A 5 "port:" BookStore.Simulator/Definitions/*.yaml

# 3. Check if port is already in use
lsof -i :17070

# 4. Restart Aspire/Simulator
cd BookStore.Aspire.AppHost && dotnet run
```

---

### Error 4: "No matching service found"

**Symptom:**
- Request reaches simulator but returns generic 404
- Simulator logs show "No service matched the incoming request"

**Causes:**
- Trigger conditions don't match request
- URI path doesn't match
- HTTP method doesn't match
- Required headers missing

**Debug Steps:**

1. **Enable verbose logging:**
   ```yaml
   connections:
     - name: debug-connection
       port: 17070
       capture: true  # Captures all traffic
   ```

2. **Check trigger conditions:**
   ```yaml
   services:
     - name: MyService
       steps:
         - direction: In
           trigger:
             - uri: "/v1/messages"  # Must match exactly
             - method: "POST"       # Must match exactly
   ```

3. **Test with wildcard:**
   ```yaml
   trigger:
     - uri: "*"      # Matches any path
     - method: "*"   # Matches any method
   ```

4. **Check simulator logs:**
   - Open Aspire Dashboard: http://localhost:15888
   - View API Simulator logs
   - Look for "Trigger evaluation" messages

---

### Error 5: "Verification failed"

**Symptom:**
```
Warning: Verification failed: Expected statusCode: 200 OK, got 500 Internal Server Error
```

**Causes:**
- External API returned unexpected response
- JSONPath doesn't match response structure
- Data type mismatch in comparison

**Solutions:**

1. **Check actual response:**
   ```yaml
   steps:
     - direction: In
       save:
         - jsonPath: $
           file: ./logs/actual_response.json  # Save full response
   ```

2. **Use exists instead of value:**
   ```yaml
   verify:
     - jsonPath: id
       exists: true  # Just check it exists
   ```

3. **Add operator for flexibility:**
   ```yaml
   verify:
     - property: StatusCode
       value: 200
       operator: Greater  # Accepts 200-299
   ```

---

### Error 6: "External API call timeout"

**Symptom:**
```
Error: Request to external API timed out after 30000ms
```

**Causes:**
- External API is slow or down
- Network issues
- Default timeout too short

**Solutions:**

```yaml
connections:
  - name: slow-api
    endpoint: https://slow-api.example.com
    listen: false
    # No timeout property in SimV1, but can use forward with simulateOn
    forward:
      simulateOn:
        timeout: 60000  # 60 second timeout
```

Or use fallback:
```yaml
connections:
  - name: proxy
    port: 8000
    forward:
      mode: ForwardFirst
      to: slow-api
      simulateOn:
        timeout: 10000  # Fallback to simulation after 10s

services:
  - name: TimeoutFallback
    steps:
      - direction: In
      - direction: Out
        message:
          payload: '{"error": "Timeout fallback"}'
```

---

### Error 7: "Invalid JSON in payload"

**Symptom:**
```
Error: Failed to parse JSON payload
```

**Causes:**
- Missing quotes around values
- Trailing commas
- Incorrect escaping

**Solutions:**

❌ Wrong:
```yaml
payload: |
  {
    "name": value,  # Missing quotes
    "items": [1, 2,],  # Trailing comma
  }
```

✅ Fix:
```yaml
payload: |-
  {
    "name": "value",
    "items": [1, 2]
  }
```

**Pro tip:** Use `payloadFile` for complex JSON:
```yaml
message:
  payloadFile: ./data/complex-response.json
```

---

### Error 8: "Buffer not found"

**Symptom:**
```
Error: Buffer reference '{B[userId]}' not found
```

**Causes:**
- Buffer not defined in earlier step
- Typo in buffer name
- Using buffer before it's captured

**Solutions:**

```yaml
services:
  - steps:
      # Step 1: Capture buffer FIRST
      - direction: In
        buffer:
          - jsonPath: user.id
            name: userId  # Define here

      # Step 2: Use buffer AFTER capture
      - direction: Out
        message:
          payload: '{"user_id": "{B[userId]}"}'  # Use here
```

---

### Error 9: "Resource not found"

**Symptom:**
```
Error: Resource 'books' not found
```

**Causes:**
- Resource not defined in resources section
- Typo in resource name
- File path incorrect

**Solutions:**

```yaml
schema: SimV1
name: my-simulation

resources:
  - name: books  # Define resource
    type: Table
    file: ./data/books.csv  # File must exist

services:
  - steps:
      - direction: Out
        message:
          payload: "{R[books]}"  # Now can reference
```

**Check file exists:**
```bash
ls -la BookStore.Simulator/Definitions/data/books.csv
```

---

## Debugging Techniques

### Technique 1: Add Logging Steps

```yaml
services:
  - name: DebugService
    steps:
      - direction: In
        trigger:
          - uri: "/debug"
        save:
          - jsonPath: $
            file: ./logs/incoming_request.json

      - direction: Out
        to: external-api
        save:
          - jsonPath: $
            file: ./logs/outgoing_request.json

      - direction: In
        save:
          - jsonPath: $
            file: ./logs/incoming_response.json
```

### Technique 2: Wildcard Matching

Create a catch-all service to see what requests are coming in:

```yaml
services:
  - name: CatchAll
    description: Matches everything for debugging
    steps:
      - direction: In
        trigger:
          - uri: "*"
          - method: "*"
        save:
          - property: Method
            file: ./logs/methods.txt
          - type: Path
            file: ./logs/paths.txt

      - direction: Out
        message:
          statusCode: 200
          payload: '{"debug": "request received"}'
```

### Technique 3: Enable Connection Capture

```yaml
connections:
  - name: debug-connection
    port: 17070
    capture: true  # Logs all traffic
```

View captured traffic in Aspire Dashboard logs.

### Technique 4: Simplify and Test

Start with minimal configuration and add complexity:

**Step 1 - Minimal:**
```yaml
schema: SimV1
name: test

connections:
  - name: test
    port: 8888

services:
  - steps:
      - direction: In
        trigger:
          - uri: "*"
      - direction: Out
        message:
          payload: "works"
```

**Step 2 - Add specificity:**
```yaml
trigger:
  - uri: "/specific/path"
  - method: "POST"
```

**Step 3 - Add verification, buffering, etc.**

---

## Validation Checklist

Before running simulation:

### YAML Syntax
- [ ] File starts with `schema: SimV1`
- [ ] Proper indentation (2 spaces, no tabs)
- [ ] Strings quoted where needed
- [ ] No trailing commas in JSON payloads

### Connections
- [ ] All connections have `name` property
- [ ] Listening connections have `port` or `endpoint`
- [ ] Outbound connections have `listen: false`
- [ ] External connections have valid URLs

### Services
- [ ] All steps have `direction` property
- [ ] `In` steps have `trigger` or `verify`
- [ ] `Out` steps have `message`
- [ ] External calls have `to: connection-name`

### Rules
- [ ] Use `verify` (not `validate`)
- [ ] Use `property: StatusCode` (not `statusCode:`)
- [ ] Use `insert` with `type: Path` (not `uri:`)
- [ ] Numeric comparisons have `dataType: Numeric`

### References
- [ ] All `to:` references exist in connections
- [ ] All `{B[name]}` references are buffered first
- [ ] All `{R[name]}` references exist in resources

---

## Testing Tools

### Test with curl

```bash
# GET request
curl http://localhost:17070/api/endpoint

# POST with JSON
curl -X POST http://localhost:17070/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# With headers
curl -H "Authorization: Bearer token" \
  http://localhost:17070/api/endpoint

# Show response headers
curl -i http://localhost:17070/api/endpoint

# Verbose output
curl -v http://localhost:17070/api/endpoint
```

### Test with Postman

1. Import collection from `BookStore.Simulator/Postman/`
2. Set environment variables
3. Run collection
4. Check test results

### Test with Contract Tests

1. Open Simulator UI: http://localhost:28880/ui/
2. Navigate to **Contract Tests**
3. Select test file
4. Run and view results

### Test with Newman

```bash
cd BookStore.Simulator/Postman
./test-simulator.sh
```

---

## Getting Help

### Check Logs

**Aspire Dashboard:**
- Open: http://localhost:15888
- View: API Simulator logs
- Filter: By severity or search terms

**Log Files:**
```bash
# Check simulator logs
tail -f logs/simulator.log

# Check Aspire logs
tail -f /tmp/aspire-startup.log
```

### Verify Schema

Validate against JSON schema:

```bash
# Using Python
python3 -c "
import json, yaml
schema = json.load(open('BookStore.Simulator/iris_schema.json'))
simulation = yaml.safe_load(open('BookStore.Simulator/Definitions/claude-api.yaml'))
# Validation logic here
"
```

### Check Documentation

- **Schema Reference**: [00-README.md](./00-README.md)
- **Quick Start**: [QUICK-START.md](./QUICK-START.md)
- **Common Patterns**: [03-SERVICES-STEPS.md](./03-SERVICES-STEPS.md)

### Example Files

Working examples in:
- `BookStore.Simulator/Definitions/` - 5 simulation files
- `BookStore.Simulator/Tests/` - 13 contract tests

---

## Performance Issues

### Simulator Slow to Start

**Causes:**
- Too many simulation files
- Large payload files
- Complex resources

**Solutions:**
- Split simulations into smaller files
- Use `includes` for modularity
- Use `payloadFile` for large responses

### High Memory Usage

**Causes:**
- Large buffers
- Many captured messages
- Learning mode recording everything

**Solutions:**
- Clear buffers after use
- Disable capture when not debugging
- Use selective learning filters

---

## Next Steps

- **[00-README.md](./00-README.md)** - Documentation index
- **[QUICK-START.md](./QUICK-START.md)** - Start fresh
- **Schema Definition**: `BookStore.Simulator/iris_schema.json`
