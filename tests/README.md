# BookStore API Tests

This directory contains automated tests for the BookStore API to ensure reliability and prevent regressions.

## Test Types

### 1. Postman Collection Tests

Location: `postman/`

- **BookStore-Smoke-Tests.postman_collection.json**: Comprehensive smoke tests for all API endpoints
- **BookStore.postman_environment.json**: Environment variables for local testing

#### Running Postman Tests

1. **Via Postman GUI**:
   - Import the collection and environment files into Postman
   - Select the "BookStore Local" environment
   - Run the collection

2. **Via Newman (CLI)**:

   ```bash
   # Install Newman
   npm install -g newman

   # Run tests
   newman run postman/BookStore-Smoke-Tests.postman_collection.json \
     -e postman/BookStore.postman_environment.json
   ```

### 2. .NET Integration Tests

Location: `../BookStore.Service.Tests.Integration/`

#### Test Categories

- **Smoke Tests**: Basic functionality tests for all endpoints
- **Health Check Tests**: Service health and readiness checks
- **Performance Tests**: Response time validation

#### Running .NET Tests

```bash
# Run all integration tests
dotnet test BookStore.Service.Tests.Integration

# Run with detailed output
dotnet test BookStore.Service.Tests.Integration --logger "console;verbosity=detailed"

# Run specific test category
dotnet test BookStore.Service.Tests.Integration --filter "FullyQualifiedName~SmokeTests"
```

## Test Coverage

### API Endpoints Tested

- ✅ GET /health
- ✅ GET /api/v1/books
- ✅ GET /api/v1/books/{id}
- ✅ POST /api/v1/books
- ✅ PUT /api/v1/books/{id}
- ✅ DELETE /api/v1/books/{id}
- ✅ GET /api/v1/books/search?query={query}

### Test Scenarios

1. **Happy Path**: Valid requests with expected responses
2. **Error Handling**: Invalid data, missing resources, bad requests
3. **Performance**: Response time validation
4. **Concurrency**: Multiple simultaneous requests

## Prerequisites

### For Postman Tests

- Postman or Newman installed
- BookStore API running on <http://localhost:7002>
- MongoDB and Redis running

### For .NET Tests

- .NET 9.0 SDK
- Docker (for Testcontainers)
- The tests use Testcontainers to automatically spin up MongoDB and Redis

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: "9.0.x"

      - name: Run Integration Tests
        run: dotnet test BookStore.Service.Tests.Integration

      - name: Run Postman Tests
        run: |
          npm install -g newman
          newman run tests/postman/BookStore-Smoke-Tests.postman_collection.json \
            -e tests/postman/BookStore.postman_environment.json
```

## Test Maintenance

### Adding New Tests

1. **Postman**:
   - Add new requests to the collection
   - Include appropriate test scripts
   - Update environment variables if needed

2. **.NET Tests**:
   - Add new test methods to appropriate test class
   - Follow existing naming conventions
   - Ensure proper cleanup in tests

### Test Data

- Tests create their own test data
- All test data is cleaned up after test execution
- Use unique identifiers (GUIDs) to avoid conflicts

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure services are running: `make run-services`
   - Check ports 7002 (API), 27017 (MongoDB), 6379 (Redis)

2. **Test Failures**:
   - Check service logs: `tail -f logs/bookstore-api.log`
   - Verify MongoDB/Redis connectivity
   - Ensure no port conflicts

3. **Testcontainers Issues**:
   - Ensure Docker is running
   - Check Docker permissions
   - Verify sufficient resources

## Best Practices

1. **Run tests before committing**: Prevents breaking changes
2. **Keep tests independent**: Each test should be self-contained
3. **Clean up test data**: Always remove created resources
4. **Monitor test performance**: Track test execution time
5. **Update tests with API changes**: Keep tests in sync with API

## Contact

For issues or questions about tests, please check the main project documentation or create an issue in the repository.
