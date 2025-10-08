# Makefile Commands Reference

Complete guide to all available Make commands for the BookStore Performance Testing project.

## Quick Start

```bash
make help              # Show all available commands
make dev-setup         # Setup development environment
make run-aspire        # Start all services with .NET Aspire
make perf-smoke        # Run quick performance test
```

## 📦 Development Setup Commands

| Command              | Description                                          | Usage                                  |
| -------------------- | ---------------------------------------------------- | -------------------------------------- |
| `make dev-setup`     | Setup development environment (install dependencies) | Run once when starting development     |
| `make clean`         | Clean build artifacts (bin/obj folders)              | Use when you need a fresh build        |
| `make build`         | Build the entire solution                            | Standard development build             |
| `make build-release` | Build in Release mode                                | For production-ready builds            |
| `make restore`       | Restore NuGet packages                               | Fix missing dependencies               |
| `make install-k6`    | Install K6 performance testing tool                  | One-time setup for performance testing |
| `make install-deps`  | Install all required dependencies                    | Complete environment setup             |

## 🚀 Run Services Commands

| Command                | Description                                       | Port                      |
| ---------------------- | ------------------------------------------------- | ------------------------- |
| `make run-aspire`      | Start all services with .NET Aspire (recommended) | 15888 (Dashboard)         |
| `make run-bookstore`   | Run BookStore API service only                    | 7001 (HTTPS), 7002 (HTTP) |
| `make run-performance` | Run Performance orchestration service only        | 7003 (HTTPS), 7004 (HTTP) |
| `make up`              | Alias for run-aspire                              | -                         |
| `make watch`           | Run with file watching (auto-reload)              | 7001/7002                 |

## 🐳 Docker Commands

| Command                     | Description                          | Notes                                                      |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `make docker-build`         | Build Docker images                  | Required before first docker-run                           |
| `make docker-run`           | Start full stack with Docker Compose | All services in containers                                 |
| `make docker-stop`          | Stop all Docker services             | Preserves data volumes                                     |
| `make docker-clean`         | Stop and remove all Docker resources | **WARNING:** Removes all data                              |
| `make docker-logs`          | Show Docker logs (all services)      | Real-time log streaming                                    |
| `make docker-observability` | Start with observability stack       | Includes Grafana (3333), Prometheus (9090), Jaeger (16686) |
| `make down`                 | Alias for docker-stop                | -                                                          |

## 📊 Monitoring & Observability Commands

| Command                     | Description                         | Access URL                        |
| --------------------------- | ----------------------------------- | --------------------------------- |
| `make docker-observability` | Start Grafana, Prometheus, Jaeger   | Grafana: <http://localhost:3333>  |
| `make logs-bookstore`       | View BookStore API logs             | -                                 |
| `make logs-performance`     | View Performance Service logs       | -                                 |
| `make status`               | Show complete project status        | Service health, Docker containers |
| `make health-check`         | Check health of all services        | Quick availability check          |
| `make health-wait`          | Wait for all services to be healthy | Use after starting services       |
| `make swagger`              | Open Swagger UI                     | <http://localhost:7002/swagger>   |
| `make aspire-dashboard`     | Open Aspire Dashboard               | <http://localhost:15889>          |

### Observability Stack URLs

- **Grafana Dashboard**: <http://localhost:3333> (admin/admin123)
- **Prometheus**: <http://localhost:9090>
- **Jaeger Tracing**: <http://localhost:16686>

## 🔥 Performance Testing Commands

### Basic Tests

| Command                   | Description                | Duration    | Virtual Users     |
| ------------------------- | -------------------------- | ----------- | ----------------- |
| `make perf-smoke`         | Quick smoke test           | 2 minutes   | 1 user            |
| `make perf-load`          | Realistic load test        | 10 minutes  | 5-10 users        |
| `make perf-stress`        | High-load stress test      | 15 minutes  | Up to 30 users    |
| `make perf-spike`         | Burst traffic test         | Variable    | Burst to 50 users |
| `make perf-comprehensive` | Run all tests sequentially | ~30 minutes | All scenarios     |

### Advanced Testing

| Command                | Description                          | Notes                        |
| ---------------------- | ------------------------------------ | ---------------------------- |
| `make docker-perf`     | Run performance test via Docker      | Isolated container execution |
| `make perf-start-test` | Start test via Performance API       | RESTful API trigger          |
| `make perf-list-tests` | List running performance tests       | Active test monitoring       |
| `make perf-results`    | View latest performance test results | Check test outcomes          |

## 📝 Data Management Commands

| Command          | Description                      | Impact                        |
| ---------------- | -------------------------------- | ----------------------------- |
| `make seed-data` | Populate database with test data | Adds sample books/authors     |
| `make reset-db`  | Reset MongoDB database           | **WARNING:** Deletes all data |

## 🔧 Development Utilities

| Command        | Description              | Use Case                  |
| -------------- | ------------------------ | ------------------------- |
| `make test`    | Run unit tests (if any)  | Continuous integration    |
| `make format`  | Format code              | Code style consistency    |
| `make restart` | Restart all services     | Quick refresh             |
| `make reset`   | Complete reset and setup | **WARNING:** Full cleanup |

## 🔄 CI/CD Commands

| Command         | Description                                    | Pipeline Stage |
| --------------- | ---------------------------------------------- | -------------- |
| `make ci-build` | CI build pipeline (restore, build, test)       | Build stage    |
| `make ci-test`  | CI test pipeline (docker, health, smoke, stop) | Test stage     |

## 📋 Common Workflows

### First Time Setup

```bash
make dev-setup
make build
make run-aspire
make seed-data
```

### Run Performance Test with Monitoring

```bash
make docker-observability   # Start monitoring stack
make run-aspire             # Start services
make health-wait            # Wait for services
make seed-data              # Add test data
make perf-load              # Run load test
# View results at http://localhost:3333 (Grafana)
```

### Quick Development Cycle

```bash
make up                     # Start services
make watch                  # Auto-reload on changes
make logs-bookstore         # Monitor logs
```

### Full Stack Testing

```bash
make docker-run             # Start everything in Docker
make health-wait            # Ensure services ready
make perf-comprehensive     # Run all tests
make perf-results          # View results
make docker-clean          # Cleanup
```

### Reset Everything

```bash
make reset                  # Complete cleanup and fresh setup
```

## ⚠️ Important Notes

- **Data Loss Commands**: `make docker-clean`, `make reset-db`, and `make reset` will delete data
- **Port Requirements**: Ensure ports 7001-7004, 27017, 6379, 9090, 16686, and 3333 are available
- **Dependencies**: Requires .NET 8 SDK, Docker Desktop, and K6 (for performance tests)
- **Aspire Mode**: Using `make run-aspire` is recommended for development as it manages all dependencies

## 🆘 Troubleshooting

| Issue                   | Solution                                             |
| ----------------------- | ---------------------------------------------------- |
| Port conflicts          | Run `make docker-clean` and check for other services |
| Build failures          | Try `make clean` then `make build`                   |
| Docker issues           | Ensure Docker Desktop is running                     |
| K6 not found            | Run `make install-k6`                                |
| Services not responding | Use `make health-wait` after starting                |

## 💡 Pro Tips

1. **Use Aspire for Development**: `make run-aspire` handles all service dependencies automatically
2. **Monitor Performance**: Keep Grafana open during tests at <http://localhost:3333>
3. **Check Status First**: Run `make status` to see what's currently running
4. **Parallel Commands**: Many commands can run simultaneously in different terminals
5. **Use Aliases**: `make up` = `make run-aspire`, `make down` = `make docker-stop`

## 🎯 Quick Command Reference

```bash
# Most common commands
make help                   # Show this help
make up                     # Start everything
make status                 # Check what's running
make perf-smoke            # Quick test
make docker-observability   # Launch monitoring
make down                   # Stop everything
make clean                  # Clean build files
```
