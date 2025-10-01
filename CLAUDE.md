# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookStore is an enterprise-grade .NET 9 performance testing application that replicates production microservice architectures. It consists of:
- **BookStore.Service** - Main API with CRUD operations for books/authors
- **BookStore.Performance.Service** - K6 test orchestration service with Docker integration
- **BookStore.Aspire.AppHost** - .NET Aspire orchestration for local development (PRIMARY METHOD)
- **BookStore.Common** - Shared models and configurations
- **BookStore.Common.Instrumentation** - OpenTelemetry integration
- **BookStore.Service.Tests.Integration** - .NET integration tests

## Key Commands

### Build and Run
```bash
# Build entire solution
dotnet build

# PRIMARY METHOD: Run with .NET Aspire (RECOMMENDED for development)
make run-aspire
# or
cd BookStore.Aspire.AppHost && dotnet run

# This starts:
# - BookStore API (port 7002)
# - Performance Service (port 7004)
# - MongoDB (managed by Aspire)
# - Redis (managed by Aspire)
# - Prometheus (port 9090)
# - Grafana (port 3000, admin/admin123)
# - Aspire Dashboard (port 15888)

# Alternative: Quick start with startup scripts (for non-Aspire environments)
make run-services          # or ./start-services.sh
make stop-services         # or ./stop-services.sh
```

### Testing
```bash
# .NET Integration Tests
dotnet test BookStore.Service.Tests.Integration
make test-integration              # Run integration tests
make test-watch                    # Run tests in watch mode

# Postman/Newman Smoke Tests (requires Newman)
make test-smoke                    # Run Postman smoke tests
make test-all                      # Run both integration and smoke tests

# K6 Performance Tests (requires K6 installed)
make perf-smoke                    # Quick test - 1 user, 2 min
make perf-load                     # Load test - 10 users, 10 min
make perf-stress                   # Stress test - 30 users, 15 min
make perf-spike                    # Spike test - burst to 50 users
make perf-comprehensive            # Run all tests (~30 min)

# Run K6 tests directly
cd BookStore.Performance.Tests
k6 run tests/books.js --env TEST_TYPE=smoke --env BASE_URL=http://localhost:7002
k6 run scenarios/load-test.js --env BASE_URL=http://localhost:7002

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

## Troubleshooting

### Aspire Workload Issues
If you encounter .NET Aspire workload installation problems:

```bash
# Clean corrupted workload manifests
rm -rf ~/.dotnet/sdk-manifests/9.0.100/microsoft.net.workload.mono.toolchain.current

# Try installing Aspire workload
dotnet workload install aspire

# If installation fails due to permission issues:
# Use the startup scripts instead - they provide equivalent functionality
make run-services
```

**Common Issues:**
- Workload dependency conflicts between Emscripten and Mono toolchain versions
- Permission denied errors on ~/.dotnet/metadata/ (requires admin privileges to fix)
- DCP executable and Dashboard binaries missing

**Solution:** Use the provided startup scripts (`./start-services.sh`) which replicate Aspire functionality without requiring workload installation.

### Service Startup Issues
```bash
# If services fail to start, check:
ls logs/                    # Check log files for errors
make status                 # Check service status
make health-check          # Test endpoint connectivity
make logs-bookstore        # View BookStore API logs
make logs-performance      # View Performance Service logs

# Common fixes:
make restart               # Stop and restart services
make reset                 # Factory reset (cleans everything)
make docker-clean          # Clean all Docker resources

# If ports are in use:
lsof -Pi :7002             # Check what's using port 7002
lsof -Pi :7004             # Check what's using port 7004
```

## Architecture Patterns

### Service Structure
Each service follows a standard structure:
- **Controllers/** - API endpoints with OpenTelemetry tracing
- **Services/** - Business logic with MongoDB/Redis integration (repository pattern)
- **Program.cs** - Service configuration with OpenTelemetry, health checks, and Aspire integration
- **appsettings.json** - Configuration for database, Redis, CORS, and telemetry

Key configuration patterns in Program.cs:
- Dual-mode Aspire/standalone support (detects connection strings to choose mode)
- Distributed cache registration for Redis
- OpenTelemetry setup via `AddBookStoreOpenTelemetry()` extension
- Health checks for MongoDB and Redis
- Seed data endpoint registration (`POST /seed-data`)

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

### Application Code
- API Controllers: `BookStore.Service/Controllers/`
- Business Logic/Repositories: `BookStore.Service/Services/`
- Service Configuration: `BookStore.Service/Program.cs`
- Shared Models: `BookStore.Common/Models/`
- OpenTelemetry Setup: `BookStore.Common.Instrumentation/`

### Testing
- Integration Tests: `BookStore.Service.Tests.Integration/`
- Postman Collections: `tests/postman/`
- K6 Performance Tests: `BookStore.Performance.Tests/`
  - Test Scenarios: `scenarios/`
  - Test Scripts: `tests/`
  - Utilities: `utils/`
  - Config: `config/`

### Infrastructure
- Aspire Orchestration: `BookStore.Aspire.AppHost/Program.cs`
- Docker Compose: `docker-compose.perf.yml`
- Startup Scripts: `start-services.sh`, `stop-services.sh`
- Makefile: Root directory (40+ automation commands)
- Monitoring Config: `monitoring/prometheus/`, `monitoring/grafana/`
- Service Settings: `*/appsettings.json`

## Development Notes

### Port Configuration
- BookStore API: port 7002
- Performance Service: port 7004
- MongoDB: port 27017
- Redis: port 6379
- Aspire Dashboard: port 15888
- Prometheus: port 9090
- Grafana: port 3000 (credentials: admin/admin123)

### Important Endpoints
- All services implement health checks at `/health`
- Swagger documentation at `/swagger` (redirects to `/swagger/index.html`)
- Prometheus metrics at `/metrics` (via OpenTelemetry exporter)
- Seed data endpoint: `POST /seed-data` (adds sample books/authors)

### Quick Access Commands
```bash
make swagger              # Open Swagger UI
make aspire-dashboard     # Open Aspire Dashboard
make grafana             # Open Grafana
make prometheus          # Open Prometheus
```

### Service Startup Methods
The project supports two startup methods:
1. **Aspire (Recommended)**: `make run-aspire` - Full orchestration with dashboard
2. **Startup Scripts**: `./start-services.sh` - Fallback when Aspire has issues

Both methods start the same services, but Aspire provides better observability.