# Tricentis Tosca API Simulator - YAML Style Guide

## Discovered Schema Errors

This document tracks schema validation errors discovered while creating Tricentis SimV1 simulations.

### Error 1: `description` is not a valid top-level property

**Invalid:**

```yaml
schema: SimV1
name: claude-api-mock
description: Mock Claude Anthropic API for zero-cost LLM performance testing # ❌ NOT VALID
services:
  - name: ServiceName
```

**Valid:**

```yaml
schema: SimV1
name: claude-api-mock
services:
  - name: ServiceName
```

**Reason:** The SimV1 schema only supports `schema`, `name`, `connections`, and `services` at the top level. Use comments for documentation instead.

---

### Error 2: Headers using `name` instead of `key`

**Invalid:**

```yaml
message:
  headers:
    - name: "content-type" # ❌ Should be 'key'
      value: "application/json"
```

**Valid:**

```yaml
message:
  headers:
    - key: "content-type" # ✅ Correct
      value: "application/json"
```

**Reason:** Header property names must use `key` and `value`, not `name` and `value`.

Note that triggers use `name` for headers, but message headers use `key`.

---

## Valid Schema Structure

```yaml
schema: SimV1
name: simulation-name
services:
  - name: ServiceName
    steps:
      - direction: In
        trigger:
          - uri: "/path"
          - method: "POST"
      - direction: Out
        message:
          statusCode: 200
          payload: |
            { "response": "data" }
```

## Best Practices

1. **No description field** - Use YAML comments (`#`) for documentation
2. **Always specify schema: SimV1** at the top
3. **Use `|` for multi-line JSON payloads** to preserve formatting
4. **Test each simulation** after creation to catch schema errors early

---

Last updated: 2025-10-07
