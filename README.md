# BookStore Performance Testing Example

A standalone .NET 8 application designed to replicate the infrastructure complexity of enterprise microservices for performance testing investigations. This project mirrors the architecture of complex hub-services projects but uses a simple BookStore domain to focus on performance characteristics rather than business logic.

## Architecture Overview

### Services
- **BookStore.Service** - Main API service with CRUD operations
- **BookStore.Common** - Shared models and configurations
- **BookStore.Aspire.AppHost** - .NET Aspire orchestration

### Infrastructure Components
- **MongoDB** - Primary database for storing books and authors
- **Redis** - Distributed caching layer
- **OpenTelemetry** - Observability and tracing
- **K6** - Performance testing framework
- **Docker** - Container orchestration via Aspire

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

## Getting Started

### Prerequisites
- .NET 8 SDK
- Docker Desktop
- Node.js (for K6 performance tests)
- K6 (install via npm or homebrew)

### Running the Application

1. **Start with Aspire (Recommended)**:
   ```bash
   cd BookStore.Aspire.AppHost
   dotnet run
   ```
   This will automatically start MongoDB, Redis, and the BookStore service.

2. **Access the application**:
   - API: https://localhost:7001
   - Swagger UI: https://localhost:7001/swagger
   - Aspire Dashboard: https://localhost:15888

3. **Seed test data**:
   ```bash
   curl -X POST https://localhost:7001/seed-data
   ```

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

## Development

### Building the Solution
```bash
dotnet build
```

### Running Individual Services
```bash
# Start dependencies first (MongoDB + Redis)
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis

# Then start the service
cd BookStore.Service
dotnet run
```

### Configuration
- Database connection strings in `appsettings.json`
- Performance test environments in `BookStore.Performance.Tests/config/environments.js`
- Load test thresholds in `BookStore.Performance.Tests/config/thresholds.js`

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