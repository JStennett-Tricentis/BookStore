# Postman Collections for API Simulator

This directory contains Postman collections for testing the BookStore API Simulator mock endpoints.

## Collections

### API-Simulator-Tests.postman_collection.json

Comprehensive test collection covering all simulator endpoints:

- **Simulator Management** (2 requests)
- **Claude API Mock** - Port 17070 (1 request)
- **OpenAI API Mock** - Port 18080 (1 request)
- **Ollama API Mock** - Port 11434 (2 requests)
- **AWS Bedrock Mock** - Port 19090 (2 requests)
- **BookStore REST API Mock** - Port 17777 (6 requests)

**Total**: 14 requests across 6 endpoint groups

## Quick Start with Newman

```bash
# Install Newman
npm install -g newman

# Run collection
cd Examples/postman
newman run API-Simulator-Tests.postman_collection.json \
  -e API-Simulator.postman_environment.json

# Run with HTML report
newman run API-Simulator-Tests.postman_collection.json \
  -e API-Simulator.postman_environment.json \
  -r htmlextra
```

## Import into Postman

1. Open Postman Desktop
2. Click **Import** → Select files:
   - `API-Simulator-Tests.postman_collection.json`
   - `API-Simulator.postman_environment.json`
3. Select environment from dropdown (top-right)
4. Start testing!

## Related Documentation

- [Simulation Files](../../simulations/Books/README.md)
- [Project Overview](../../CLAUDE.md)
