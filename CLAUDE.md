# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookStore is an enterprise-grade .NET 8 performance testing application that replicates production microservice architectures. It consists of:
- BookStore.Service - Main API with CRUD operations for books/authors
- BookStore.Performance.Service - K6 test orchestration service with Docker integration
- BookStore.Aspire.AppHost - .NET Aspire orchestration for local development
- BookStore.Common - Shared models and configurations
- BookStore.Common.Instrumentation - OpenTelemetry integration

## Key Commands

### Build and Run
```bash
# Build entire solution
dotnet build

# Run with .NET Aspire (recommended for development)
cd BookStore.Aspire.AppHost
dotnet run

# Run individual services (requires MongoDB and Redis)
cd BookStore.Service && dotnet run
cd BookStore.Performance.Service && dotnet run
```

### Testing
```bash
# No unit tests currently - focus is on performance testing

# Run K6 performance tests (requires K6 installed)
cd BookStore.Performance.Tests

# Quick smoke test (1 user, 2 minutes)
k6 run tests/books.js --env TEST_TYPE=smoke

# Load test (5-10 users, 10 minutes)
k6 run scenarios/load-test.js

# Run via Performance Service API
curl -X POST http://localhost:7004/api/v1/performancetest/start \
  -H "Content-Type: application/json" \
  -d '{"scenario": "smoke"}'
```

### Docker Operations
```bash
# Start full stack with Docker Compose
docker-compose -f docker-compose.perf.yml up -d

# Stop all services
docker-compose -f docker-compose.perf.yml down

# View logs
docker-compose -f docker-compose.perf.yml logs -f bookstore-api
```

## Architecture Patterns

### Service Structure
Each service follows a standard structure:
- Controllers/ - API endpoints with OpenTelemetry tracing
- Services/ - Business logic with MongoDB/Redis integration
- Program.cs - Service configuration with OpenTelemetry setup

### MongoDB Integration
- Connection string: `ConnectionStrings:MongoDB` in appsettings.json
- Database: `bookstore`
- Collections: `books`, `authors`
- Repository pattern in `Services/BookRepository.cs`

### Redis Caching
- Connection string: `ConnectionStrings:Redis` in appsettings.json
- Distributed caching for GET operations
- Cache keys pattern: `book_{id}`, `books_list_{params}`

### OpenTelemetry
- All services export traces/metrics/logs
- Custom activities in business operations
- OTLP exporter configured for Jaeger/Prometheus

### Performance Testing
- K6 tests in BookStore.Performance.Tests/
- Test scenarios: smoke, load, stress, spike
- User profiles: reader, librarian, manager
- Performance Service provides Docker-based orchestration

## Key Files and Locations

- API Controllers: `BookStore.Service/Controllers/`
- MongoDB Repositories: `BookStore.Service/Services/`
- K6 Test Scenarios: `BookStore.Performance.Tests/scenarios/`
- Docker Configuration: `docker-compose.perf.yml`
- Service Settings: `*/appsettings.json`

## Development Notes

- Services use port 7002 (BookStore), 7003 (Performance) in development
- MongoDB runs on default port 27017
- Redis runs on default port 6379
- Aspire Dashboard available at http://localhost:15888
- All services implement health checks at `/health`
- Swagger documentation at `/swagger`