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
	@printf "\033[36m%-30s\033[0m %s\n" "make run-services" "Start all services (recommended)"
	@printf "\033[36m%-30s\033[0m %s\n" "make perf-smoke" "Run quick performance test"
	@printf "\033[36m%-30s\033[0m %s\n" "make status" "Check service status"
	@echo ""
	@echo "📦 DEVELOPMENT SETUP"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(dev-setup|clean|build|build-release|restore|install-k6|install-deps|format|format-check|test|test-integration|test-smoke|test-watch|test-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
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
	@grep -E '^(perf-smoke|perf-load|perf-stress|perf-spike|perf-chaos|perf-comprehensive|perf-errors|perf-start-test|perf-list-tests|perf-results|perf-clean|perf-report|perf-report-latest|perf-report-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🌪️  CHAOS TESTING (Extreme Load)"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(perf-chaos|perf-extreme|chaos-workspace|grafana-chaos):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🤖 AI/LLM PERFORMANCE TESTING"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(perf-ai-smoke|perf-ai-load|perf-ai-stress|perf-ai-spike|perf-mixed|perf-mixed-heavy|perf-ai-all):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🎭 API SIMULATOR (Zero-Cost LLM Testing)"
	@echo "──────────────────────────────────────────────────────────────────"
	@grep -E '^(simulator-start|simulator-stop|simulator-restart|simulator-logs|simulator-status|simulator-ui|simulator-verify):.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
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
run-aspire: ## Start all services with Aspire Dashboard [REQUIRES .NET 9 SDK]
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
	@docker-compose -f docker-compose.perf.yml down 2>/dev/null || echo "  Docker containers already stopped or daemon not running"
	@echo "Stopping Aspire and .NET processes..."
	@pkill -9 -f "BookStore.Service.dll" 2>/dev/null || true
	@pkill -9 -f "BookStore.Performance.Service.dll" 2>/dev/null || true
	@pkill -9 -f "BookStore.Aspire.AppHost" 2>/dev/null || true
	@pkill -9 -f "dotnet run.*BookStore" 2>/dev/null || true
	@pkill -9 -f "dcpctrl" 2>/dev/null || true
	@echo "✅ All services stopped"

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

.PHONY: perf-chaos
perf-chaos: ## Chaos test - random spikes, errors, LLM, all metrics (~4 min)
	@echo "🌪️  Running chaos test - testing ALL dashboard widgets..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run scenarios/chaos-test.js --env BASE_URL=http://localhost:7002 \
		--out json=results/chaos-test-$(shell date +%Y%m%d-%H%M%S).json; \
		EXIT_CODE=$$?; \
		echo "✓ Chaos complete. Generating HTML report..."; \
		LATEST_JSON=$$(ls -t results/chaos-test-*.json 2>/dev/null | head -1); \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			REPORT=$$(ls -t results/chaos-test-*.html 2>/dev/null | head -1) && \
			[ -n "$$REPORT" ] && open "$$REPORT"; \
		fi; \
		exit $$EXIT_CODE

.PHONY: perf-extreme
perf-extreme: ## 🔥 EXTREME chaos test - WILL BREAK SYSTEM! (500+ VUs, 80% errors, ~6 min)
	@echo "🔥🔥🔥 WARNING: EXTREME CHAOS TEST 🔥🔥🔥"
	@echo "This test is DESIGNED TO BREAK YOUR SYSTEM!"
	@echo ""
	@echo "Peak load: 700 concurrent VUs"
	@echo "Error rate: 50-80%"
	@echo "Duration: ~6 minutes"
	@echo "Expected: Service degradation, crashes, resource exhaustion"
	@echo ""
	@read -p "Are you sure? This WILL stress test to failure. (yes/no): " confirm; \
	if [ "$$confirm" != "yes" ]; then \
		echo "Cancelled. Use 'make perf-chaos' for standard chaos testing."; \
		exit 1; \
	fi
	@echo ""
	@echo "🔥 Starting EXTREME chaos test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run scenarios/extreme-chaos-test.js --env BASE_URL=http://localhost:7002 \
		--out json=results/extreme-chaos-$(shell date +%Y%m%d-%H%M%S).json; \
		EXIT_CODE=$$?; \
		echo "✓ EXTREME chaos complete (if system survived). Generating report..."; \
		LATEST_JSON=$$(ls -t results/extreme-chaos-*.json 2>/dev/null | head -1); \
		if [ -n "$$LATEST_JSON" ]; then \
			node generate-html-report.js "$$LATEST_JSON" && \
			LATEST_HTML=$$(ls -t results/*.html 2>/dev/null | head -1) && \
			echo "📊 Opening report: $$LATEST_HTML" && \
			(open "$$LATEST_HTML" || xdg-open "$$LATEST_HTML" 2>/dev/null); \
		fi; \
		exit $$EXIT_CODE

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
		k6 run tests/ai-summary.js --env SCENARIO=llmSmoke --env BASE_URL=http://localhost:7002 \
		--out json=results/ai-smoke-$(shell date +%Y%m%d-%H%M%S).json
	@echo "✓ Test complete. Run 'make perf-report' to view HTML report"

.PHONY: perf-ai-load
perf-ai-load: ## AI load test (3-5 users, 12 min)
	@echo "Running AI summary load test..."
	@mkdir -p BookStore.Performance.Tests/results
	@cd BookStore.Performance.Tests && \
		k6 run tests/ai-summary.js --env SCENARIO=llmLoad --env BASE_URL=http://localhost:7002 \
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
		k6 run tests/ai-summary.js --env SCENARIO=llmStress --env BASE_URL=http://localhost:7002 \
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
		k6 run tests/ai-summary.js --env SCENARIO=llmSpike --env BASE_URL=http://localhost:7002 \
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
		k6 run scenarios/error-scenarios.js --env SCENARIO=errorTest --env BASE_URL=http://localhost:7002 \
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
	@echo "Formatting markdown/JSON/YAML files..."
	@npm run format

.PHONY: format-check
format-check: ## Check formatting without making changes
	@echo "Checking formatting..."
	@npm run format:check

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
	@open http://localhost:3333 || xdg-open http://localhost:3333

.PHONY: grafana-chaos
grafana-chaos: ## Open Chaos Testing dashboard (RECOMMENDED for chaos testing)
	@echo "Opening Chaos Testing dashboard..."
	@open http://localhost:3333/d/bookstore-chaos || xdg-open http://localhost:3333/d/bookstore-chaos

.PHONY: grafana-dashboards
grafana-dashboards: ## Open all Grafana dashboards in separate tabs
	@echo "Opening all Grafana dashboards..."
	@open http://localhost:3333/d/bookstore-perf || xdg-open http://localhost:3333/d/bookstore-perf
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-errors || xdg-open http://localhost:3333/d/bookstore-errors
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-llm || xdg-open http://localhost:3333/d/bookstore-llm
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-dotnet-runtime || xdg-open http://localhost:3333/d/bookstore-dotnet-runtime
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-http-performance || xdg-open http://localhost:3333/d/bookstore-http-performance
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-threading || xdg-open http://localhost:3333/d/bookstore-threading
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-chaos || xdg-open http://localhost:3333/d/bookstore-chaos
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-dependencies || xdg-open http://localhost:3333/d/bookstore-dependencies
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-system || xdg-open http://localhost:3333/d/bookstore-system
	@echo "✓ All 8 dashboards opened"

.PHONY: grafana-demo
grafana-demo: ## Open comprehensive demo dashboard (53 curated panels)
	@echo "Opening demo dashboard..."
	@open http://localhost:3333/d/bookstore-demo || xdg-open http://localhost:3333/d/bookstore-demo
	@echo "✓ Demo dashboard opened"

.PHONY: grafana-mega
grafana-mega: ## Open MEGA dashboard with ALL 91 widgets
	@echo "Opening MEGA dashboard..."
	@open http://localhost:3333/d/bookstore-mega || xdg-open http://localhost:3333/d/bookstore-mega
	@echo "✓ MEGA dashboard opened (91 widgets across 8 sections)"

.PHONY: prometheus
prometheus: ## Open Prometheus
	@echo "Opening Prometheus..."
	@open http://localhost:9090 || xdg-open http://localhost:9090

.PHONY: perf-dashboard
perf-dashboard: ## Open Performance Testing Dashboard (Web UI)
	@echo "Opening Performance Testing Dashboard..."
	@open http://localhost:7004 || xdg-open http://localhost:7004
	@echo "✓ Performance Dashboard opened at http://localhost:7004"

.PHONY: perf-workspace
perf-workspace: ## Open complete performance testing workspace (Dashboard + Grafana + Prometheus)
	@echo "Opening performance testing workspace..."
	@open http://localhost:7004 || xdg-open http://localhost:7004
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-mega || xdg-open http://localhost:3333/d/bookstore-mega
	@sleep 0.5
	@open http://localhost:15888 || xdg-open http://localhost:15888

.PHONY: chaos-workspace
chaos-workspace: ## Open chaos testing workspace (Dashboard + Chaos Dashboard + Aspire)
	@echo "🌪️  Opening CHAOS testing workspace..."
	@echo "   1. Performance Dashboard (start test)"
	@echo "   2. Chaos Grafana Dashboard (watch metrics)"
	@echo "   3. Aspire Dashboard (monitor services)"
	@open http://localhost:7004 || xdg-open http://localhost:7004
	@sleep 0.5
	@open http://localhost:3333/d/bookstore-chaos?refresh=5s || xdg-open http://localhost:3333/d/bookstore-chaos?refresh=5s
	@sleep 0.5
	@open http://localhost:15888 || xdg-open http://localhost:15888
	@echo "✓ Workspace opened: Performance Dashboard, Grafana, Aspire Dashboard"

# ==================== Quick Commands ====================

.PHONY: up
up: run-services ## Quick alias → run-services

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

# ==================== API Simulator Commands ====================

.PHONY: simulator-start
simulator-start: ## Start API Simulator container [$0 LLM costs]
	@echo "🎭 Starting API Simulator (zero-cost LLM testing)..."
	@docker network create bookstore-network 2>/dev/null || true
	@docker-compose -f docker-compose.simulator.yml up -d
	@echo "⏳ Waiting for simulator to be healthy..."
	@sleep 5
	@$(MAKE) simulator-status

.PHONY: simulator-stop
simulator-stop: ## Stop API Simulator container
	@echo "Stopping API Simulator..."
	@docker-compose -f docker-compose.simulator.yml down

.PHONY: simulator-restart
simulator-restart: simulator-stop simulator-start ## Restart API Simulator

.PHONY: simulator-logs
simulator-logs: ## View API Simulator logs
	@docker-compose -f docker-compose.simulator.yml logs -f

.PHONY: simulator-status
simulator-status: ## Check if API Simulator is running
	@echo "Checking API Simulator status..."
	@curl -s http://localhost:17070/health > /dev/null 2>&1 && \
		echo "✅ API Simulator: Running (Port 17070)" || \
		echo "❌ API Simulator: Not running"
	@curl -s http://localhost:28880 > /dev/null 2>&1 && \
		echo "✅ Simulator UI: http://localhost:28880" || \
		echo "❌ Simulator UI: Not accessible"
	@curl -s http://localhost:5020 > /dev/null 2>&1 && \
		echo "✅ Simulator API: http://localhost:5020" || \
		echo "❌ Simulator API: Not accessible"

.PHONY: simulator-ui
simulator-ui: ## Open API Simulator UI Dashboard
	@echo "Opening API Simulator UI..."
	@open http://localhost:28880 || xdg-open http://localhost:28880

.PHONY: simulator-verify
simulator-verify: ## Verify Docker image access
	@echo "Verifying API Simulator Docker image access..."
	@docker pull ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci:0.2 && \
		echo "✅ Docker image accessible" || \
		echo "❌ Cannot access Docker image - check credentials"

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


# ==================== BenchmarkDotNet (Micro-benchmarks) ====================

.PHONY: bench
bench: ## Run all BenchmarkDotNet micro-benchmarks
	@echo "🔬 Running BenchmarkDotNet micro-benchmarks..."
	@echo ""
	@echo "This tests code-level performance (algorithms, memory allocations)"
	@echo "Complementary to K6 load tests (API-level performance)"
	@echo ""
	@cd BookStore.Benchmarks && dotnet run -c Release -- $(if $(FILTER),--filter $(FILTER),)

.PHONY: bench-json
bench-json: ## Benchmark JSON serialization performance
	@echo "🔬 Benchmarking JSON serialization..."
	@cd BookStore.Benchmarks && dotnet run -c Release -- '--filter=*Json*'

.PHONY: bench-string
bench-string: ## Benchmark string manipulation performance
	@echo "🔬 Benchmarking string manipulation..."
	@cd BookStore.Benchmarks && dotnet run -c Release -- '--filter=*String*'

.PHONY: bench-memory
bench-memory: ## Run benchmarks with detailed memory profiler
	@echo "🔬 Running benchmarks with memory profiler..."
	@cd BookStore.Benchmarks && dotnet run -c Release -- --memory

.PHONY: bench-report
bench-report: ## Open latest benchmark HTML reports
	@echo "📊 Opening benchmark reports..."
	@LATEST_HTML=$$(ls -t BookStore.Benchmarks/BenchmarkDotNet.Artifacts/results/*.html 2>/dev/null | head -1); \
	if [ -z "$$LATEST_HTML" ]; then \
		echo "❌ No benchmark reports found. Run 'make bench' first."; \
	else \
		for report in BookStore.Benchmarks/BenchmarkDotNet.Artifacts/results/*.html; do \
			open "$$report"; \
		done; \
		echo "✓ Opened $$(ls BookStore.Benchmarks/BenchmarkDotNet.Artifacts/results/*.html 2>/dev/null | wc -l | xargs) report(s)"; \
	fi

.PHONY: bench-results
bench-results: ## Show benchmark results directory
	@echo "📂 Benchmark results location:"
	@echo "   BookStore.Benchmarks/BenchmarkDotNet.Artifacts/results/"
	@echo ""
	@if [ -d "BookStore.Benchmarks/BenchmarkDotNet.Artifacts/results" ]; then \
		echo "Available reports:"; \
		ls -lh BookStore.Benchmarks/BenchmarkDotNet.Artifacts/results/*.html 2>/dev/null | \
		awk '{print "   " $$9 " (" $$5 ")"}' || echo "   No reports yet"; \
	else \
		echo "❌ No results directory found. Run 'make bench' first."; \
	fi

.PHONY: bench-clean
bench-clean: ## Clean benchmark artifacts
	@echo "🧹 Cleaning benchmark artifacts..."
	@rm -rf BookStore.Benchmarks/BenchmarkDotNet.Artifacts/
	@rm -rf BookStore.Benchmarks/bin/Release/
	@echo "✓ Benchmark artifacts cleaned"

.PHONY: bench-help
bench-help: ## Show BenchmarkDotNet usage guide
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "   BenchmarkDotNet - Micro-Benchmark Performance Testing"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "📖 What is BenchmarkDotNet?"
	@echo "   Micro-benchmarking tool for measuring code-level performance"
	@echo "   Tests isolated methods without HTTP overhead"
	@echo ""
	@echo "🎯 When to Use:"
	@echo "   ✅ Optimize algorithms (compare implementations)"
	@echo "   ✅ Reduce memory allocations (GC pressure)"
	@echo "   ✅ Test single methods in isolation"
	@echo "   ✅ Compare library versions"
	@echo "   ✅ Find performance regressions"
	@echo ""
	@echo "⚡ Commands:"
	@echo "   make bench              # Run all micro-benchmarks"
	@echo "   make bench-json         # JSON serialization benchmarks"
	@echo "   make bench-string       # String manipulation benchmarks"
	@echo "   make bench FILTER=*Foo* # Run specific benchmark"
	@echo "   make bench-memory       # Run with memory profiler"
	@echo ""
	@echo "📊 Reports & Results:"
	@echo "   make bench-report       # Open HTML reports in browser"
	@echo "   make bench-results      # Show available report files"
	@echo "   make bench-clean        # Clean all benchmark artifacts"
	@echo ""
	@echo "📈 vs K6 Load Testing:"
	@echo "   BenchmarkDotNet → Code-level (μs, ns, memory allocations)"
	@echo "   K6              → API-level (concurrent users, HTTP latency)"
	@echo ""
	@echo "📚 Full Guide: BookStore.Benchmarks/README.md"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
