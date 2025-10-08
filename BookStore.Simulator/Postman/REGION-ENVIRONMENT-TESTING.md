# Region/Environment-Specific Testing Guide

This guide explains how to test model availability and behavior that varies by region and environment using the enhanced Postman collections.

## Problem Statement

**Different models behave differently based on:**

- **Region:** `us-east-1`, `eu-west-2`, etc.
- **Environment:** `development`, `staging`, `production`

**Examples:**

- `gpt-4-turbo` might be available in US prod but returns 404 in EU prod
- `claude-3-opus` might be forbidden in EU (403) but work in US (200)
- `gpt-3.5-turbo` might be deprecated (410) in production but still work in dev

## CSV Structure

### test-data-models-by-region.csv

```csv
model_id,region,environment,expected_status,expected_error_code,expected_error_message,test_description
gpt-4-turbo,us-east-1,production,200,,,GPT-4 Turbo in US East Prod
gpt-4-turbo,eu-west-2,production,404,model_not_found,Model not available in this region,GPT-4 Turbo not available in EU Prod
claude-3-opus,eu-west-2,development,403,forbidden,Model not available for this tenant,Claude Opus forbidden in EU Dev
gpt-3.5-turbo,us-east-1,production,410,model_deprecated,This model has been deprecated,GPT-3.5 deprecated in US Prod
```

**Columns:**

1. **model_id** - Model name to test (can be empty for missing model tests)
2. **region** - Region identifier (us-east-1, eu-west-2, etc.)
3. **environment** - Environment (development, staging, production)
4. **expected_status** - HTTP status code expected (200, 404, 403, 410, etc.)
5. **expected_error_code** - Error code in response.error.code (optional)
6. **expected_error_message** - Expected text in error message (optional, case-insensitive match)
7. **test_description** - Human-readable test description

## Usage

### Step 1: Configure Your Environments

Update CSV with your region/environment combinations:

```csv
# Add your specific region/env combos
model_id,region,environment,expected_status,expected_error_code,expected_error_message,test_description
your-model,us-west-2,staging,200,,,Your model in US West staging
your-model,ap-southeast-1,production,404,model_not_found,Not available in APAC,Your model not in APAC
```

### Step 2: Run Collection

1. Open **Collection Runner**
2. Select **BookStore-API-Region-Environment-Tests** collection
3. Select **"Test Models by Region/Environment"** request
4. Import **test-data-models-by-region.csv**
5. Click **Run**

### Step 3: Analyze Results

**Example output:**

```
✓ [us-east-1/production] GPT-4 Turbo in US East Prod - Status 200
✓ [us-east-1/production] GPT-4 Turbo in US East Prod - Has valid response
✓ [us-east-1/production] GPT-4 Turbo in US East Prod - Model in response

✓ [eu-west-2/production] GPT-4 Turbo not available in EU Prod - Status 404
✓ [eu-west-2/production] GPT-4 Turbo not available in EU Prod - Has error object
✓ [eu-west-2/production] GPT-4 Turbo not available in EU Prod - Error code is 'model_not_found'
✓ [eu-west-2/production] GPT-4 Turbo not available in EU Prod - Error message contains expected text
```

## Test Validation

### Success Cases (200)

**Validates:**

- ✅ Status code is 200
- ✅ Response has `choices` array
- ✅ Response has `model` field
- ✅ Model in response matches requested model

### Error Cases (4xx/5xx)

**Validates:**

- ✅ Status code matches expected
- ✅ Response has `error` object
- ✅ Error code matches (if specified)
- ✅ Error message contains expected text (if specified)

## Common Status Codes

| Code    | Meaning             | When to Use                                      |
| ------- | ------------------- | ------------------------------------------------ |
| **200** | Success             | Model available and working                      |
| **400** | Bad Request         | Invalid request format, missing required fields  |
| **403** | Forbidden           | Model not available for this tenant/subscription |
| **404** | Not Found           | Model doesn't exist in this region/environment   |
| **410** | Gone                | Model deprecated/removed                         |
| **429** | Too Many Requests   | Rate limit exceeded                              |
| **500** | Server Error        | Internal server error                            |
| **502** | Bad Gateway         | Upstream provider error                          |
| **503** | Service Unavailable | Service temporarily down                         |

## Customizing for Your Setup

### Example: Add Custom Region

```csv
model_id,region,environment,expected_status,expected_error_code,expected_error_message,test_description
gpt-4-turbo,ap-south-1,production,200,,,GPT-4 in India
claude-sonnet-4,ap-south-1,production,404,model_not_found,Model not available in this region,Claude not in India
```

### Example: Add Custom Environment

```csv
model_id,region,environment,expected_status,expected_error_code,expected_error_message,test_description
gpt-4-turbo,us-east-1,qa,200,,,GPT-4 in QA environment
experimental-model,us-east-1,qa,200,,,Experimental model in QA only
experimental-model,us-east-1,production,404,model_not_found,Model not available in production,Experimental not in prod
```

### Example: Test Tenant-Specific Models

```csv
model_id,region,environment,expected_status,expected_error_code,expected_error_message,test_description
custom-tenant-model,us-east-1,production,200,,,Custom model for tenant A
custom-tenant-model,us-east-1,production,403,forbidden,Model not available for this tenant,Custom model forbidden for tenant B
```

## Advanced Scenarios

### Scenario 1: Model Migration

Test a model being migrated from one region to another:

```csv
# Before migration
old-model,us-east-1,production,200,,,Old model in US East
old-model,eu-west-1,production,404,model_not_found,Model not yet available,Old model not in EU yet

# After migration
old-model,us-east-1,production,410,model_deprecated,Please use new-model,Old model deprecated in US
old-model,eu-west-1,production,200,,,Old model now in EU
new-model,us-east-1,production,200,,,New model in US
new-model,eu-west-1,production,200,,,New model in EU
```

### Scenario 2: Gradual Rollout

Test models being rolled out to environments progressively:

```csv
# Week 1: Dev only
new-feature-model,us-east-1,development,200,,,New model in dev
new-feature-model,us-east-1,staging,404,model_not_found,Not yet in staging,Not in staging yet
new-feature-model,us-east-1,production,404,model_not_found,Not yet in production,Not in prod yet

# Week 2: Dev + Staging
new-feature-model,us-east-1,development,200,,,New model in dev
new-feature-model,us-east-1,staging,200,,,New model in staging
new-feature-model,us-east-1,production,404,model_not_found,Not yet in production,Not in prod yet

# Week 3: All environments
new-feature-model,us-east-1,development,200,,,New model in dev
new-feature-model,us-east-1,staging,200,,,New model in staging
new-feature-model,us-east-1,production,200,,,New model in production
```

### Scenario 3: License-Based Availability

Test models with different licensing per region:

```csv
premium-model,us-east-1,production,200,,,Premium model with US license
premium-model,eu-west-2,production,403,license_required,License not available in this region,No EU license
premium-model,ap-south-1,production,403,license_required,License not available in this region,No APAC license
```

## Passing Region/Environment to API

The collection sends region/environment as **HTTP headers**:

```javascript
headers: {
  "X-Region": "{{current_region}}",
  "X-Environment": "{{current_environment}}"
}
```

### If Your API Uses Different Method:

**Option 1: URL Path**

```javascript
url: "{{base_url}}/v1/{{current_region}}/{{current_environment}}/chat/completions";
```

**Option 2: Query Parameters**

```javascript
url: "{{base_url}}/v1/chat/completions?region={{current_region}}&env={{current_environment}}";
```

**Option 3: Request Body**

```json
{
  "model": "{{model_id}}",
  "region": "{{current_region}}",
  "environment": "{{current_environment}}",
  "messages": [...]
}
```

Edit the request in the collection to match your API's convention.

## Naughty Strings Testing

### What Are Naughty Strings?

**Naughty strings** are edge case inputs designed to break software:

- SQL injection attempts
- XSS/script injection
- Unicode edge cases
- Format string exploits
- Path traversal attempts
- Emoji and special characters
- Reserved keywords
- Numeric edge cases

### File Structure

**test-data-naughty-strings.txt** (readable):

```
# SQL Injection
' OR '1'='1' --
'; DROP TABLE users--

# XSS
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>

# Unicode
田中さん
مرحبا
😀😃😄
```

**test-data-naughty-strings.csv** (for testing):

```csv
naughty_string,category,expected_behavior
"' OR '1'='1' --",sql_injection,should_not_execute
"<script>alert('XSS')</script>",xss_injection,should_not_execute
田中さん,cjk,should_accept
😀😃😄,emoji,should_accept
```

### Running Naughty String Tests

1. Open **Collection Runner**
2. Select **"Test Naughty Strings - Chat"** or **"Test Naughty Strings - Embeddings"**
3. Import **test-data-naughty-strings.csv**
4. Run

### What Tests Validate

**For Chat Completions:**

- ✅ No server errors (500+)
- ✅ XSS/SQL not echoed back verbatim
- ✅ Format strings not executed
- ✅ Handles unicode gracefully

**For Embeddings:**

- ✅ **NEVER returns 403** (all text is valid data)
- ✅ Returns 200 or 400 (not content policy errors)
- ✅ Generates valid embeddings
- ✅ No content filtering

### Example Results

```
✓ [sql_injection] Handles input without server error
✓ [sql_injection] Has valid response structure
✓ [sql_injection] Response doesn't echo dangerous content verbatim

✓ [xss_injection] Handles input without server error
✓ [xss_injection] Has valid response structure
✓ [xss_injection] Response doesn't echo dangerous content verbatim

✓ [emoji] Handles input without server error
✓ [emoji] Has valid response structure

❌ [xss_injection] Embeddings accepts input (200 or 400 for invalid format)
   Expected: 200 or 400
   Got: 403
   ❌ CONTENT POLICY VIOLATION - Embeddings should not block text!
```

### Adding Your Own Naughty Strings

Edit `test-data-naughty-strings.txt`:

```
# Your custom edge cases
your-weird-input-here
another-edge-case
```

Then regenerate CSV or manually add to CSV:

```csv
naughty_string,category,expected_behavior
your-weird-input-here,custom_test,should_handle
another-edge-case,custom_test,should_handle
```

## Troubleshooting

### Issue: All tests show wrong region/environment

**Cause:** API not respecting headers

**Fix:** Check how your API receives region/environment (headers, URL, body) and update request accordingly

### Issue: Error messages don't match

**Cause:** Error message text changed or different format

**Fix:** Update `expected_error_message` in CSV with actual text (case-insensitive match)

### Issue: Naughty strings cause 500 errors

**Cause:** Server not handling edge cases properly

**Action:** This is a BUG! Report findings:

- Which strings cause 500 errors
- Error messages/stack traces
- Should be 400 (validation) not 500

### Issue: Embeddings return 403 for HTML/XSS

**Cause:** Incorrect content filtering on embeddings

**Action:** This is a BUG! Embeddings should accept all text. See ERROR-TESTING-GUIDE.md

## Best Practices

### ✅ Do's

- **Test all region/env combinations** for each model
- **Update CSV when models change** availability
- **Test before and after deployments** to catch regressions
- **Use descriptive test_description** to explain why test exists
- **Include both success and error cases** for completeness

### ❌ Don'ts

- **Don't hardcode expected values** - use CSV for flexibility
- **Don't skip error message validation** - catches API changes
- **Don't test production with naughty strings at high volume** - be respectful of rate limits
- **Don't assume all regions behave the same** - explicitly test each

## Integration with CI/CD

```bash
# Test all regions before deployment
newman run BookStore-API-Region-Environment-Tests.postman_collection.json \
  --iteration-data test-data-models-by-region.csv \
  --reporters cli,junit \
  --reporter-junit-export region-test-results.xml

# Fail build if any tests fail
if [ $? -ne 0 ]; then
  echo "Region/environment tests failed!"
  exit 1
fi
```

## Monitoring

Set up **Postman Monitors** to continuously test:

- Model availability by region/environment
- Naughty string handling
- Error message consistency

**Alert on:**

- Unexpected 403/404 errors
- Changed error messages
- 500 errors from edge cases
- Content policy violations on embeddings

This catches issues before users do!
