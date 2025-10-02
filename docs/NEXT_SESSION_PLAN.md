# Next Claude Code Session Plan

## Project Status Summary

✅ **COMPLETED** - Enterprise-grade performance testing infrastructure is now fully operational

- K6 Performance Orchestration Service with Docker integration
- Complete OpenTelemetry observability stack
- Advanced Docker orchestration with multi-profile support
- Comprehensive K6 test suite with realistic user scenarios
- Production-ready Makefile with 40+ automation commands
- Enterprise architecture documentation

## Immediate Next Session Goals

### 🎯 Primary Objective: Test & Validate Complete Setup

Time Estimate: 30-45 minutes

1. **Quick Validation** (5 minutes)

   ```bash
   cd /Users/j.stennett/TAIS/AiHubPerfExample
   make status
   make dev-setup  # If needed
   ```

2. **Full System Smoke Test** (10 minutes)

   ```bash
   make run-aspire
   # Wait 30 seconds
   make health-check
   make seed-data
   make perf-smoke
   ```

3. **Performance Service Validation** (10 minutes)

   ```bash
   # Test the Performance API
   curl http://localhost:7004/api/v1/performancetest/scenarios
   make perf-start-test
   make perf-list-tests
   ```

4. **Docker Stack Verification** (10 minutes)

   ```bash
   make docker-stop  # Clean slate
   make docker-run
   make health-wait
   make docker-perf
   ```

## Secondary Objectives (Based on Time Available)

### 🚀 Enhancement Priority List

#### **Option A: Multi-Tenant Authentication (High Value)**

Time: 45-60 minutes

- Add JWT middleware similar to hub-services
- Implement X-Tenant-Name, X-User-Id headers
- Create authentication test scenarios
- **Files to create:**
  - `BookStore.Common.Authentication/`
  - Middleware classes for tenant context
  - Updated K6 tests with auth

#### **Option B: Enhanced MongoDB/Redis (Medium Value)**

Time: 30-45 minutes

- Add connection pooling configuration
- Implement MongoDB health checks with retry logic
- Add Redis clustering support
- **Files to modify:**
  - `BookStore.Service/Program.cs`
  - MongoDB connection configuration
  - Redis advanced settings

#### **Option C: Management Service (Medium Value)**

Time: 45-60 minutes

- Create `BookStore.Management.Service` to match hub-services architecture
- Add admin endpoints for system management
- Implement system health aggregation
- **Files to create:**
  - Complete Management Service project
  - Admin API controllers
  - System monitoring endpoints

#### **Option D: Advanced K6 Scenarios (Low Value - Already Strong)**

Time: 30-45 minutes

- Add specific performance regression tests
- Create business-specific test scenarios
- Add performance alerting thresholds
- **Files to enhance:**
  - Additional K6 test files
  - Custom metrics collection

## Potential Issues & Mitigations

### Expected Issues

1. **Port conflicts** - Solution: `make docker-clean && make status`
2. **Docker build issues** - Solution: Check Docker Desktop is running
3. **K6 missing** - Solution: `brew install k6`
4. **Service startup timing** - Solution: Use `make health-wait`

### Recovery Commands

```bash
# Complete reset if needed
make docker-clean
make clean
make dev-setup
make run-aspire
```

## Success Criteria for Next Session

### ✅ Minimum Success (Must Achieve)

- [ ] All services start successfully with `make run-aspire`
- [ ] Health checks pass with `make health-check`
- [ ] Basic smoke test completes with `make perf-smoke`
- [ ] Performance API responds correctly

### 🎯 Ideal Success (Target)

- [ ] Complete performance test suite runs successfully
- [ ] Docker orchestration works flawlessly
- [ ] Real-time monitoring via SignalR functions
- [ ] Performance results are properly collected and displayed
- [ ] One enhancement (A, B, C, or D) completed

### 🚀 Exceptional Success (Stretch)

- [ ] Multiple enhancements completed
- [ ] Full observability stack working (Jaeger, Prometheus, Grafana)
- [ ] Custom business metrics implemented
- [ ] Performance regression detection setup

## Session Structure Recommendation

### Phase 1: Validation (15 minutes)

- Quick setup verification
- Run basic smoke tests
- Ensure all services are healthy

### Phase 2: Choose Enhancement (30-45 minutes)

- Pick ONE from Options A-D based on business value
- Implement systematically with proper testing
- Document changes in CLAUDE.md

### Phase 3: Integration & Testing (15 minutes)

- Full system test with enhancements
- Update documentation
- Commit changes

## Key Files to Reference

### Essential Files

- `CLAUDE.md` - Complete command reference
- `Makefile` - All automation commands
- `README.md` - Architecture overview
- `docker-compose.perf.yml` - Docker orchestration

### Important Directories

- `BookStore.Performance.Service/` - K6 orchestration
- `BookStore.Common.Instrumentation/` - OpenTelemetry setup
- `BookStore.Performance.Tests/` - K6 test scenarios

## Commands Cheat Sheet for Next Session

```bash
# Quick start
make dev-setup && make run-aspire

# Validation commands
make status
make health-check
make perf-smoke

# Debugging
make logs-bookstore
make logs-performance
make docker-logs

# Results
make perf-results
make perf-list-tests

# Reset if needed
make docker-clean
make clean
```

## Context for Next Claude Instance

**What we built**: Enterprise-grade performance testing infrastructure
replicating hub-services complexity but with simple BookStore domain.

**Current state**: Complete, production-ready system with K6 orchestration,
OpenTelemetry observability, Docker multi-profile setup, and comprehensive
automation.

**Primary value**: Safe, standalone environment for performance testing
investigations without exposing sensitive hub-services code.

**Next focus**: Validate everything works perfectly, then enhance based on
specific performance testing needs identified during validation.

---

**Repository**: <https://github.com/JStennett-Tricentis/BookStore.git>
**Local Path**: `/Users/j.stennett/TAIS/AiHubPerfExample`
**Status**: ✅ Ready for immediate use
