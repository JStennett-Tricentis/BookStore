# API Simulator - Simulation Definitions

This directory contains simulation definitions for the Tricentis API Simulator.

## Purpose

Mock external LLM API providers (Claude, OpenAI, Bedrock) for zero-cost performance testing.

## Files

- `claude-api.json` - Claude Anthropic API simulations
- `openai-api.json` - OpenAI API simulations
- `bedrock-api.json` - AWS Bedrock API simulations

## Usage

1. Start simulator: `make simulator-start`
2. Verify running: `make simulator-status`
3. Open UI: `make simulator-ui` → http://localhost:28880
4. Configure services to use: `http://localhost:5020`

## Next Steps

Phase 2 will add complete simulation definitions based on hub-services-latest patterns.
