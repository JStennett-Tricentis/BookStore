# BookStore Performance Testing - Makefile
# Enterprise-grade automation for development, testing, and deployment

.PHONY: help
help: ## Show this help message

	@echo "╔══════════════════════════════════════════════════════════════════╗"
	@echo "║       BookStore Performance Testing - Available Commands        ║"
	@echo "╚══════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "🚀 QUICK START"
	@echo "──────────────────────────────────────────────────────────────────"
	@printf "\033[36m%-30s\033[0m %s\n" "make dev-setup" "Setup development environment"
	@printf "\033[36m%-30s\033[0m %s\n" "make run-aspire" "Start all services (recommended)"
	@printf "\033[36m%-30s\033[0m %s\n" "make perf-smoke" "Run quick performance test"
	@printf "\033[36m%-30s\033[0m %s\n" "make status" "Check service status"
	@echo ""
	@echo "📦 DEVELOPMENT SETUP"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(dev-setup|clean|build|build-release|restore|install-k6|install-deps|format|test|test-integration|test-smoke|test-watch|test-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🎯 RUN SERVICES"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(run-aspire|run-services|stop-services|run-bookstore|run-performance|up|watch):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🐳 DOCKER OPERATIONS"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(docker-build|docker-run|docker-stop|docker-clean|docker-logs|docker-observability|docker-perf|down):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🔥 PERFORMANCE TESTING"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(perf-smoke|perf-load|perf-stress|perf-spike|perf-comprehensive|perf-errors|perf-start-test|perf-list-tests|perf-results|perf-clean|perf-report|perf-report-latest|perf-report-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🤖 AI/LLM PERFORMANCE TESTING"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(perf-ai-smoke|perf-ai-load|perf-ai-stress|perf-ai-spike|perf-mixed|perf-mixed-heavy|perf-ai-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📊 MONITORING & HEALTH"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(health-check|health-wait|status|logs-bookstore|logs-performance|swagger|aspire-dashboard|grafana|grafana-mega|grafana-demo|grafana-dashboards|prometheus):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "💾 DATA MANAGEMENT"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(seed-data|reset-db):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🔄 WORKFLOWS & CI/CD"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(restart|reset|ci-build|ci-test):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📚 For detailed documentation, see MAKEFILE_COMMANDS.md"
	@echo "──────────────────────────────────────────────────────────────────"

# ==================== Development Setup ====================

.PHONY: dev-setup
dev-setup: ## Initial setup - install all dependencies
	@echo "Setting up development environment..."
	@which dotnet > /dev/null || (echo "Please install .NET 8 SDK" && exit 1)
	@which docker > /dev/null || (echo "Please install Docker Desktop" && exit 1)
	@which k6 > /dev/null || echo "Warning: K6 not installed. Run: brew install k6"
	@dotnet restore
	@echo "Development environment ready!"

.PHONY: clean
clean: ## Remove all build artifacts (bin/obj)
	@echo "Cleaning build artifacts..."
	@find . -type d -name bin -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name obj -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean complete"

# ==================== Build Commands ====================

.PHONY: build
build: ## Build solution (Debug mode)
	@echo "Building BookStore solution..."
	@dotnet build

.PHONY: build-release
build-release: ## Build solution (Release mode)
	@echo "Building BookStore solution in Release mode..."
	@dotnet build -c Release

.PHONY: restore
restore: ## Restore NuGet packages
	@echo "Restoring NuGet packages..."
	@dotnet restore

# ==================== Run Services ====================

.PHONY: run-aspire
run-aspire: ## Start all services with Aspire [RECOMMENDED - Auto-cleans MongoDB]
	@./scripts/startup/start-aspire.sh

.PHONY: run-services
run-services: ## Start all services (alternative to Aspire)
	@echo "Starting services with startup script..."
	@./scripts/startup/start-services.sh

.PHONY: stop-services
stop-services: ## Stop all running services
	@echo "Stopping all services..."
	@./scripts/startup/stop-services.sh

.PHONY: run-bookstore
run-bookstore: ## Run BookStore API only (port 7002)
	@echo "Starting BookStore API service..."
	@cd BookStore.Service && dotnet run --urls "http://localhost:7002"

.PHONY: run-performance
run-performance: ## Run Performance service only (port 7004)
	@echo "Starting Performance service..."
	@cd BookStore.Performance.Service && dotnet run --urls "http://localhost:7004"

# ==================== Testing Commands ====================

.PHONY: test-smoke
test-smoke: ## Run smoke tests with Postman (requires Newman)
	@echo "Running Postman smoke tests..."
	@command -v newman >/dev/null 2>&1 || { echo "Newman not installed. Install with: npm install -g newman"; exit 1; }
	newman run tests/postman/BookStore-Smoke-Tests.postman_collection.json \
		-e tests/postman/BookStore.postman_environment.json

.PHONY: test-integration
test-integration: ## Run .NET integration tests
	@echo "Running .NET integration tests..."
	dotnet test BookStore.Service.Tests.Integration --logger "console;verbosity=normal"

.PHONY: test-all
test-all: test-integration test-smoke ## Run all tests

.PHONY: test-watch
test-watch: ## Run .NET tests in watch mode
	dotnet watch test --project BookStore.Service.Tests.Integration

# ==================== Docker Commands ====================

.PHONY: docker-build
docker-build: ## Build Docker images
	@echo "Building Docker images..."
	@docker-compose -f docker-compose.perf.yml build

.PHONY: docker-run
docker-run: ## Start full stack in Docker
	@echo "Starting full stack with Docker..."
	@docker-compose -f docker-compose.perf.yml up -d
	@echo "Services starting... Run 'make health-check' to verify"

.PHONY: docker-stop
docker-stop: ## Stop Docker services (keeps data)
	@echo "Stopping Docker services..."
	@docker-compose -f docker-compose.perf.yml down

.PHONY: docker-clean
docker-clean: docker-stop ## Clean all Docker resources [DATA LOSS]
	@echo "Cleaning Docker resources..."
	@docker-compose -f docker-compose.perf.yml down -v --remove-orphans
	@docker system prune -f

.PHONY: docker-logs
docker-logs: ## Show Docker logs (all services)
	@docker-compose -f docker-compose.perf.yml logs -f

.PHONY: docker-observability
docker-observability: ## Start monitoring stack (Grafana:3333)
	@echo "Starting with observability stack..."
	@docker-compose -f docker-compose.perf.yml --profile observability up -d
	@echo "Observability stack starting..."
	@echo "Jaeger UI: http://localhost:16686"
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana: http://localhost:3333"

# ==================== Performance Testing ====================

.PHONY: perf-smoke
perf-smoke: ## Quick test - 1 user, 2 min
	@echo "Running smoke test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/books.js --env TEST_TYPE=smoke --env BASE_URL=http://localhost:7002 \
		--out json=results/smoke-test-$(shell date +%Y%m%d-%H%M%S).json; \
		EXIT_CODE=$$?; \
		echo "✓ Test complete. Generating HTML report..."; \
		LATEST_JSON=$$(ls -t results/smoke-test-*.json 2>/dev/null | head -1); \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			(open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML" 2>/dev/null); \
		fi; \
		exit $$EXIT_CODE

.PHONY: perf-load
perf-load: ## Load test - 10 users, 10 min
	@echo "Running load test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run scenarios/load-test.js --env BASE_URL=http://localhost:7002 \
		--out json=results/load-test-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/load-test-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-stress
perf-stress: ## Stress test - 30 users, 15 min
	@echo "Running stress test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/books.js --env TEST_TYPE=stress --env BASE_URL=http://localhost:7002 \
		--out json=results/stress-test-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/stress-test-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-spike
perf-spike: ## Spike test - burst to 50 users
	@echo "Running spike test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/books.js --env TEST_TYPE=spike --env BASE_URL=http://localhost:7002 \
		--out json=results/spike-test-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/spike-test-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-comprehensive
perf-comprehensive: ## Run ALL tests (~30 min)
	@echo "Running comprehensive performance test suite..."
	@$(MAKE) perf-smoke
	@sleep 30
	@$(MAKE) perf-load
	@sleep 30
	@$(MAKE) perf-stress

# ==================== LLM Performance Testing ====================

.PHONY: perf-ai-smoke
perf-ai-smoke: ## Quick AI summary test (1-2 users, 3 min)
	@echo "Running AI summary smoke test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/ai-summary.js --env SCENARIO=llm_smoke --env BASE_URL=http://localhost:7002 \
		--out json=results/ai-smoke-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Run 'make perf-report' to view HTML report"

.PHONY: perf-ai-load
perf-ai-load: ## AI load test (3-5 users, 12 min)
	@echo "Running AI summary load test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/ai-summary.js --env SCENARIO=llm_load --env BASE_URL=http://localhost:7002 \
		--out json=results/ai-load-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/ai-load-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-ai-stress
perf-ai-stress: ## AI stress test (5-15 users, 17 min)
	@echo "Running AI summary stress test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/ai-summary.js --env SCENARIO=llm_stress --env BASE_URL=http://localhost:7002 \
		--out json=results/ai-stress-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/ai-stress-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-ai-spike
perf-ai-spike: ## AI spike test (2 → 20 users, 8 min)
	@echo "Running AI summary spike test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/ai-summary.js --env SCENARIO=llm_spike --env BASE_URL=http://localhost:7002 \
		--out json=results/ai-spike-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/ai-spike-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-mixed
perf-mixed: ## Mixed workload test (CRUD + AI, 20% LLM traffic)
	@echo "Running mixed workload test (80% CRUD / 20% AI)..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run scenarios/mixed-workload.js --env BASE_URL=http://localhost:7002 \
			--env LLM_PERCENTAGE=20 --env AI_USERS=30 \
			--out json=results/mixed-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/mixed-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-mixed-heavy
perf-mixed-heavy: ## Mixed workload test (50% LLM traffic)
	@echo "Running heavy AI mixed workload test (50% CRUD / 50% AI)..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run scenarios/mixed-workload.js --env BASE_URL=http://localhost:7002 \
			--env LLM_PERCENTAGE=50 --env AI_USERS=60 \
			--out json=results/mixed-heavy-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Generating HTML report..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/mixed-heavy-*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		fi

.PHONY: perf-ai-all
perf-ai-all: ## Run all AI performance tests (~40 min)
	@echo "Running comprehensive AI performance test suite..."
	@$(MAKE) perf-ai-smoke
	@sleep 30
	@$(MAKE) perf-ai-load
	@sleep 30
	@$(MAKE) perf-mixed
	@sleep 30
	@$(MAKE) perf-ai-spike

.PHONY: perf-errors
perf-errors: ## Error handling test (intentionally generates errors)
	@echo "Running error scenario test..."
	@echo "⚠️  This test intentionally generates errors to validate error handling"
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run scenarios/error-scenarios.js --env BASE_URL=http://localhost:7002 \
		--out json=results/errors-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Run 'make perf-report' to view HTML report"
	@echo "📊 Check Grafana for error metrics and traces in Traceloop"

.PHONY: docker-perf
docker-perf: ## Run performance test via Docker
	@echo "Running performance test in Docker..."
	@docker run --rm -i --network host grafana/k6 run - <BookStore.Performance.Tests/tests/books.js

.PHONY: perf-start-test
perf-start-test: ## Start performance test via API
	@echo "Starting performance test via API..."
	@curl -X POST http://localhost:7004/api/v1/performancetest/start \
		-H "Content-Type: application/json" \
		-d '{"scenario": "smoke", "duration": "2m", "vus": 1}'

.PHONY: perf-list-tests
perf-list-tests: ## List running performance tests
	@echo "Listing performance tests..."
	@curl http://localhost:7004/api/v1/performancetest/tests

.PHONY: perf-results
perf-results: ## View latest performance test results
	@echo "Latest performance test results:"
	@ls -lht BookStore.Performance.Tests/results/ 2>/dev/null | head -20 || echo "No results found"

.PHONY: perf-report
perf-report: ## Generate HTML report from latest JSON results
	@echo "Generating HTML report from latest K6 results..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/*.json 2>/dev/null | head -1) && \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML"; \
		else \
			echo "No JSON results found. Run a performance test first."; \
		fi

.PHONY: perf-clean
perf-clean: ## Clean old performance test results
	@echo "Cleaning performance test results..."
	@rm -rf BookStore.Performance.Tests/results/*.json BookStore.Performance.Tests/results/*.html
	@echo "✓ Results cleaned"

# ==================== Health & Monitoring ====================

.PHONY: health-check
health-check: ## Quick health status check
	@echo "Checking service health..."
	@curl -s http://localhost:7002/health || echo "BookStore API: Not responding"
	@curl -s http://localhost:7004/health || echo "Performance Service: Not responding"
	@echo "Health check complete"

.PHONY: health-wait
health-wait: ## Wait for services to start (30s)
	@echo "Waiting for services to be healthy..."
	@for i in {1..30}; do \
		if curl -s http://localhost:7002/health > /dev/null 2>&1; then \
			echo "Services are healthy!"; \
			break; \
		fi; \
		echo "Waiting... ($$i/30)"; \
		sleep 2; \
	done

.PHONY: status
status: ## Show all services & container status
	@echo "=== BookStore Project Status ==="
	@echo ""
	@echo "Services:"
	@curl -s http://localhost:7002/health > /dev/null 2>&1 && echo "✅ BookStore API: Running" || echo "❌ BookStore API: Not running"
	@curl -s http://localhost:7004/health > /dev/null 2>&1 && echo "✅ Performance Service: Running" || echo "❌ Performance Service: Not running"
	@echo ""
	@echo "Infrastructure:"
	@docker ps | grep mongodb > /dev/null 2>&1 && echo "✅ MongoDB: Running" || echo "❌ MongoDB: Not running"
	@docker ps | grep redis > /dev/null 2>&1 && echo "✅ Redis: Running" || echo "❌ Redis: Not running"
	@echo ""
	@echo "Docker Containers:"
	@docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(bookstore|mongodb|redis)" || echo "No containers running"

.PHONY: logs-bookstore
logs-bookstore: ## View BookStore API logs
	@docker-compose -f docker-compose.perf.yml logs -f bookstore-api 2>/dev/null || \
		echo "BookStore API not running in Docker. Check console output if running locally."

.PHONY: logs-performance
logs-performance: ## View Performance Service logs
	@docker-compose -f docker-compose.perf.yml logs -f performance-service 2>/dev/null || \
		echo "Performance Service not running in Docker. Check console output if running locally."

# ==================== Data Management ====================

.PHONY: seed-data
seed-data: ## Add sample books to database
	@echo "Seeding test data..."
	@cd BookStore.Performance.Tests && node utils/seed-data.js || \
		(echo "Seeding via API..." && \
		curl -X POST http://localhost:7002/seed-data -H "Content-Type: application/json")

.PHONY: reset-db
reset-db: ## Drop MongoDB database [DATA LOSS]
	@echo "Resetting database..."
	@docker exec -it mongodb mongosh bookstore --eval "db.dropDatabase()" 2>/dev/null || \
		echo "MongoDB not running in Docker or database doesn't exist"

# ==================== Development Utilities ====================

.PHONY: test
test: ## Run unit tests
	@echo "Running tests..."
	@dotnet test || echo "No unit tests found"

.PHONY: format
format: ## Auto-format all code files
	@echo "Formatting code..."
	@dotnet format
	@echo "Formatting JS/JSON/YAML/MD files..."
	@npx prettier --write .

.PHONY: watch
watch: ## Run with hot-reload enabled
	@echo "Starting with file watch..."
	@cd BookStore.Service && dotnet watch run

.PHONY: swagger
swagger: ## Open Swagger UI
	@echo "Opening Swagger UI..."
	@open http://localhost:7002/swagger || xdg-open http://localhost:7002/swagger

.PHONY: aspire-dashboard
aspire-dashboard: ## Open Aspire Dashboard
	@echo "Opening Aspire Dashboard..."
	@open http://localhost:15888 || xdg-open http://localhost:15888

.PHONY: grafana
grafana: ## Open Grafana Dashboard
	@echo "Opening Grafana Dashboard..."
	@open http://localhost:3000 || xdg-open http://localhost:3000

.PHONY: grafana-dashboards
grafana-dashboards: ## Open all Grafana dashboards in separate tabs
	@echo "Opening all Grafana dashboards..."
	@open http://localhost:3000/d/bookstore-perf || xdg-open http://localhost:3000/d/bookstore-perf
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-errors || xdg-open http://localhost:3000/d/bookstore-errors
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-llm || xdg-open http://localhost:3000/d/bookstore-llm
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-dotnet-runtime || xdg-open http://localhost:3000/d/bookstore-dotnet-runtime
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-http-performance || xdg-open http://localhost:3000/d/bookstore-http-performance
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-threading || xdg-open http://localhost:3000/d/bookstore-threading
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-dependencies || xdg-open http://localhost:3000/d/bookstore-dependencies
	@sleep 0.5
	@open http://localhost:3000/d/bookstore-system || xdg-open http://localhost:3000/d/bookstore-system
	@echo "✓ All 8 dashboards opened"

.PHONY: grafana-demo
grafana-demo: ## Open comprehensive demo dashboard (53 curated panels)
	@echo "Opening demo dashboard..."
	@open http://localhost:3000/d/bookstore-demo || xdg-open http://localhost:3000/d/bookstore-demo
	@echo "✓ Demo dashboard opened"

.PHONY: grafana-mega
grafana-mega: ## Open MEGA dashboard with ALL 91 widgets
	@echo "Opening MEGA dashboard..."
	@open http://localhost:3000/d/bookstore-mega || xdg-open http://localhost:3000/d/bookstore-mega
	@echo "✓ MEGA dashboard opened (91 widgets across 8 sections)"

.PHONY: prometheus
prometheus: ## Open Prometheus
	@echo "Opening Prometheus..."
	@open http://localhost:9090 || xdg-open http://localhost:9090

# ==================== Quick Commands ====================

.PHONY: up
up: run-aspire ## Quick alias → run-aspire

.PHONY: down
down: docker-stop ## Quick alias → docker-stop

.PHONY: restart
restart: down up ## Stop and restart services

.PHONY: reset
reset: docker-clean clean dev-setup ## Factory reset [DATA LOSS]

# ==================== Installation Helpers ====================

.PHONY: install-k6
install-k6: ## Install K6 performance testing tool
	@echo "Installing K6..."
	@if [[ "$$(uname)" == "Darwin" ]]; then \
		brew install k6; \
	else \
		echo "Please visit https://k6.io/docs/getting-started/installation/ for installation instructions"; \
	fi

.PHONY: install-deps
install-deps: ## Install all required dependencies
	@echo "Checking and installing dependencies..."
	@$(MAKE) dev-setup
	@$(MAKE) install-k6

# ==================== CI/CD Commands ====================

.PHONY: ci-build
ci-build: restore build test ## CI build pipeline

.PHONY: ci-test
ci-test: docker-run health-wait perf-smoke docker-stop ## CI test pipeline

# Default target
.DEFAULT_GOAL := help
.PHONY: perf-report-latest
perf-report-latest: ## Generate and open HTML report from latest JSON result
	@echo "📊 Generating report from latest test result..."
	@cd BookStore.Performance.Tests && \
		LATEST_JSON=$$(ls -t results/*.json 2>/dev/null | head -1); \
		if [ -z "$$LATEST_JSON" ]; then \
			echo "❌ No test results found in BookStore.Performance.Tests/results/"; \
			exit 1; \
		fi; \
		echo "   Using: $$LATEST_JSON"; \
		node generate-html-report.js "$$LATEST_JSON" && \
		LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
		echo "✓ Report generated: $$LATEST_HTML" && \
		(open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML" 2>/dev/null) && \
		echo "✓ Opened in browser"

.PHONY: perf-report-all
perf-report-all: ## Generate HTML reports for all JSON results
	@echo "📊 Generating reports for all test results..."
	@cd BookStore.Performance.Tests && \
		for json in results/*.json; do \
			if [ -f "$$json" ]; then \
				echo "   Processing: $$json"; \
				node generate-html-report.js "$$json"; \
			fi; \
		done && \
		echo "✓ All reports generated"
