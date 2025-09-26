# BookStore Performance Testing Example

An enterprise-grade .NET 8 application designed to replicate the full infrastructure complexity of production microservices for comprehensive performance testing investigations. This project mirrors the architecture of complex hub-services projects but uses a simple BookStore domain to focus on performance characteristics rather than business logic.

## Architecture Overview

### Core Services
- **BookStore.Service** - Main API service with CRUD operations
- **BookStore.Performance.Service** - K6 orchestration service with Docker integration
- **BookStore.Common** - Shared models and configurations
- **BookStore.Common.Instrumentation** - OpenTelemetry integration library
- **BookStore.Aspire.AppHost** - .NET Aspire orchestration

### Enterprise Infrastructure
- **MongoDB** - Primary database with connection pooling and instrumentation
- **Redis** - Distributed caching with advanced configuration
- **OpenTelemetry** - Full observability stack (tracing, metrics, logging)
- **K6** - Performance testing with Docker orchestration
- **Docker** - Container orchestration with multi-profile support
- **SignalR** - Real-time performance test monitoring

### API Endpoints
- `GET /api/v1/books` - List books with filtering and pagination
- `GET /api/v1/books/{id}` - Get specific book
- `POST /api/v1/books` - Create new book
- `PUT /api/v1/books/{id}` - Update existing book
- `PATCH /api/v1/books/{id}` - Partial update book
- `DELETE /api/v1/books/{id}` - Delete book
- `GET /api/v1/books/search` - Search books
- `GET /api/v1/authors` - List authors
- `POST /api/v1/authors` - Create new author

## Enterprise Features

### Performance Orchestration Service
- **Docker-based K6 orchestration** - Run performance tests in isolated containers
- **Real-time test monitoring** - SignalR-based live updates
- **Multiple test scenarios** - Smoke, Load, Stress, Spike testing
- **Result aggregation** - Comprehensive metrics collection and analysis
- **RESTful API** - Programmatic test execution and monitoring

### OpenTelemetry Integration
- **Distributed tracing** - Full request tracing across services
- **Custom metrics** - Business-specific performance indicators
- **Structured logging** - Correlated logs with trace context
- **Multiple exporters** - Console, OTLP, Prometheus support
- **Activity tracking** - Detailed span creation in business logic

### Docker Orchestration
- **Multi-profile support** - Development, performance, observability stacks
- **Health checks** - Proper service dependency management
- **Volume management** - Persistent data and shared results
- **Network isolation** - Secure inter-service communication

## Getting Started

### Prerequisites
- .NET 8 SDK
- Docker Desktop
- K6 (install via homebrew: `brew install k6`)
- Make (for using Makefile commands)

### Quick Start (Recommended)

1. **Setup development environment**:
   ```bash
   make dev-setup
   ```

2. **Start with .NET Aspire**:
   ```bash
   make run-aspire
   ```
   This automatically starts MongoDB, Redis, BookStore service, and Performance service.

3. **Access the applications**:
   - BookStore API: https://localhost:7001
   - Performance Service: https://localhost:7003
   - Swagger UI: https://localhost:7001/swagger
   - Aspire Dashboard: https://localhost:15888

4. **Run your first performance test**:
   ```bash
   make perf-smoke
   ```

### Alternative: Docker Compose

1. **Start full stack with Docker**:
   ```bash
   make docker-run
   ```

2. **Start with observability stack**:
   ```bash
   make docker-observability
   ```
   Includes Jaeger, Prometheus, and Grafana.

### Performance Testing

1. **Install K6**:
   ```bash
   npm install -g k6
   # or
   brew install k6
   ```

2. **Run performance tests**:
   ```bash
   cd BookStore.Performance.Tests

   # Smoke test (1 user)
   npm run test:smoke

   # Load test (5-10 users)
   npm run test:load

   # Stress test (up to 30 users)
   npm run test:stress

   # Spike test (burst to 50 users)
   npm run test:spike
   ```

### Manual Testing

Test the API endpoints:

```bash
# List books
curl https://localhost:7001/api/v1/books

# Get specific book
curl https://localhost:7001/api/v1/books/{book-id}

# Create a book
curl -X POST https://localhost:7001/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "isbn": "978-1-234-56789-0",
    "price": 19.99,
    "genre": "Fiction",
    "description": "A test book",
    "stockQuantity": 10,
    "publishedDate": "2024-01-01"
  }'
```

## Performance Testing Features

The K6 performance tests include:
- **Multiple user profiles** (reader, librarian, manager) with different operation patterns
- **Realistic load patterns** with proper think times
- **Comprehensive metrics** tracking response times, error rates, and throughput
- **Different scenarios** (smoke, load, stress, spike testing)
- **Caching validation** to test Redis performance impact
- **Database load simulation** with MongoDB operations

## Project Structure

```
BookStore.sln
├── BookStore.Common/              # Shared models and configuration
├── BookStore.Service/             # Main API service
├── BookStore.Aspire.AppHost/      # .NET Aspire orchestration
├── BookStore.Performance.Tests/   # K6 performance tests
│   ├── config/                    # Environment and threshold configs
│   ├── tests/                     # Test scenarios
│   ├── utils/                     # Helper functions
│   └── package.json               # NPM scripts for testing
└── README.md
```

## Development Workflow

### Available Commands (Use Makefile)
```bash
# Get all available commands
make help

# Development workflow
make dev-setup          # Setup development environment
make run-aspire         # Start all services with .NET Aspire
make health-check       # Check service health
make seed-data         # Populate with test data

# Performance testing
make perf-smoke         # Quick 2-minute smoke test
make perf-load          # Realistic 10-minute load test
make perf-stress        # High-load 15-minute stress test
make perf-comprehensive # Run all tests sequentially

# Docker operations
make docker-run                # Full stack with Docker
make docker-observability      # With monitoring stack
make docker-clean             # Clean Docker resources

# Debugging & monitoring
make logs-bookstore    # View service logs
make status           # Complete project status
make perf-results     # View performance test results
```

### Manual Development
```bash
# Build solution
dotnet build

# Run individual services (requires dependencies)
cd BookStore.Service && dotnet run
cd BookStore.Performance.Service && dotnet run
```

### Configuration Files
- `appsettings.json` - Service configuration with telemetry settings
- `docker-compose.perf.yml` - Docker orchestration with multiple profiles
- `BookStore.Performance.Tests/config/environments.js` - Test environments
- `BookStore.Performance.Tests/config/thresholds.js` - Performance thresholds
- `Makefile` - Development automation with 40+ commands

## Performance Characteristics

This application is designed to simulate the performance characteristics of complex enterprise applications:
- **Database operations** with MongoDB document queries
- **Caching layers** with Redis for improved response times
- **Multiple service endpoints** with varying complexity
- **Realistic data models** with relationships and indexes
- **Distributed tracing** for observability

Use this project to:
- Test performance monitoring tools
- Validate load testing strategies
- Experiment with caching optimizations
- Practice performance troubleshooting
- Benchmark different deployment configurations