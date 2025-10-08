# Tricentis API Simulator - Schema Basics

**Reference**: `/Users/j.stennett/API Simulator/api-simulator-examples`

## Top-Level Structure

```yaml
schema: SimV1 # REQUIRED - Must be exactly "SimV1"
name: simulation-name # REQUIRED - Unique simulation identifier

connections: # OPTIONAL - Define external endpoints or listen ports
  - name: connectionName
    port: 17071

services: # REQUIRED - At least one service must be defined
  - name: ServiceName # OPTIONAL - Service identifier
    steps:
      - direction: In # Request matcher
      - direction: Out # Response definition
```

## Schema Version

**Always use**: `schema: SimV1`

❌ **Invalid**:

```yaml
schema: SimV2              # Does not exist
schema: "SimV1"            # Quotes not needed
```

✅ **Valid**:

```yaml
schema: SimV1
```

## Name Field

The `name` field is **required** at the top level and identifies the simulation.

```yaml
schema: SimV1
name: my-api-simulation # Required
```

**Best Practices**:

- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Avoid spaces and special characters

## Top-Level Properties

| Property      | Required | Type   | Description                        |
| ------------- | -------- | ------ | ---------------------------------- |
| `schema`      | ✅ Yes   | String | Must be "SimV1"                    |
| `name`        | ✅ Yes   | String | Simulation identifier              |
| `connections` | ❌ No    | Array  | External endpoints or listen ports |
| `services`    | ✅ Yes   | Array  | Service definitions with steps     |

## Minimal Valid Simulation

```yaml
schema: SimV1
name: minimal-example

services:
  - steps:
      - direction: In
        trigger:
          - uri: "*"
      - direction: Out
        message:
          payload: Hello world!
```

## Common Mistakes

### ❌ Missing `schema`

```yaml
name: my-simulation
services: []
```

**Error**: Simulation will not be recognized

### ❌ Wrong schema version

```yaml
schema: SimV2
name: my-simulation
```

**Error**: Unsupported schema version

### ❌ Invalid top-level property

```yaml
schema: SimV1
name: my-simulation
description: This will cause an error # ❌ NOT VALID
services: []
```

**Error**: `description` is not a valid top-level property (use comments instead)

## Next Steps

- [Connections](./02-CONNECTIONS.md) - Define endpoints and ports
- [Services and Steps](./03-SERVICES-STEPS.md) - Create service logic
- [Messages](./04-MESSAGES.md) - Structure requests and responses
