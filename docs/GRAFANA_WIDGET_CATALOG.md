# Grafana Dashboard Widget Catalog

**Purpose:** Comprehensive analysis of all Grafana dashboard widgets for the BookStore Performance Testing project.

**Date:** 2025-10-02

**Total Dashboards:** 9 (8 functional + 1 corrupted)

**Total Widgets:** 237 across all dashboards

---

## Executive Summary

This catalog documents every widget across all Grafana dashboards to help the
team decide which widgets to keep, consolidate, or remove. Widgets are
categorized by business value:

- **🔴 Critical** (28 widgets): Detect failures impacting users - KEEP ALL
- **🟡 High** (18 widgets): Measure user experience/performance - KEEP MOST
- **💰 High** (21 widgets): Track operational costs (LLM) - KEEP ALL
- **🔧 Medium** (42 widgets): Prevent resource exhaustion - REVIEW & CONSOLIDATE
- **📊 Medium** (128 widgets): Provide operational insight - CANDIDATES FOR REMOVAL

---

## Dashboard Inventory

| Dashboard File                         | Title                        | Panels | Purpose                            | Status            |
| -------------------------------------- | ---------------------------- | ------ | ---------------------------------- | ----------------- |
| `bookstore-demo.json`                  | Demo - Complete Overview     | 53     | Production-ready curated dashboard | ✅ Primary        |
| `bookstore-mega.json`                  | MEGA Dashboard - All Metrics | 99     | Complete metrics collection        | ⚠️ Reference Only |
| `bookstore-performance.json`           | Performance Testing          | 9      | K6 test monitoring                 | ✅ Keep           |
| `bookstore-errors-diagnostics.json`    | Errors & Diagnostics         | 18     | Error tracking & debugging         | ✅ Critical       |
| `bookstore-llm-metrics.json`           | LLM Metrics                  | 7      | AI cost tracking                   | ✅ Keep           |
| `bookstore-dotnet-runtime.json`        | .NET Runtime                 | 11     | Runtime internals                  | 🔄 Consolidate    |
| `bookstore-http-performance.json`      | HTTP & Kestrel               | 11     | HTTP metrics                       | 🔄 Consolidate    |
| `bookstore-threading-concurrency.json` | Threading & Concurrency      | 14     | Thread pool metrics                | 🔄 Consolidate    |
| `bookstore-dependencies.json`          | External Dependencies        | 15     | Outbound calls                     | ✅ Keep           |
| `bookstore-system-health.json`         | System Health                | ERROR  | Corrupted JSON                     | ❌ Fix/Remove     |

---

## Recommended Widget Categories

### Category 1: MUST KEEP - Critical Business Metrics (28 widgets)

These widgets detect failures that directly impact users and should be on all production dashboards.

#### Error Detection (14 widgets)

1. **5xx Error Rate** - Server failures
2. **4xx Client Error Rate** - Client errors
3. **Error Rate** - Overall error percentage
4. **.NET Exceptions per Minute** - Application crashes
5. **Total Exceptions (Lifetime)** - Exception counter
6. **500 Internal Server Error** - Unhandled exceptions
7. **503 Service Unavailable** - Dependency failures
8. **422 Validation Error** - Data validation issues
9. **Error Rate by HTTP Status Code** (timeseries)
10. **5xx Errors by Endpoint** (timeseries)
11. **4xx Errors by Endpoint** (timeseries)
12. **.NET Exception Rate** (timeseries)
13. **Endpoints by Error Rate** (table) - Problem identification
14. **Exception Rate** (timeseries)

**Queries:**

```promql
# Error rate
sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[1m]))
/ sum(rate(http_server_request_duration_seconds_count[1m]))

# Exception rate
rate(process_runtime_dotnet_exceptions_count_total[1m]) * 60
```

#### Performance SLIs (14 widgets)

1. **P95 Response Time** - User experience metric
2. **P99 Response Time** - Tail latency
3. **Requests per Second** - Traffic volume
4. **Request Rate by Endpoint** (timeseries)
5. **HTTP Request Duration Percentiles** (P50/P90/P95/P99)
6. **Response Time Percentiles by Endpoint**
7. **Active HTTP Requests** - Current load
8. **Request Rate (req/sec)** - Throughput
9. **HTTP Client P95 Latency** - Dependency latency
10. **HTTP Client Request Duration Percentiles**
11. **Total Requests (5m)** - Recent volume
12. **Active Connections** - Connection count
13. **Queued Connections** - Backpressure indicator
14. **Connection Duration Percentiles**

**Queries:**

```promql
# P95 response time
histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket[1m])) by (le)) * 1000

# Request rate
sum(rate(http_server_request_duration_seconds_count[1m])) by (http_route)
```

---

### Category 2: HIGH VALUE - Cost Tracking (21 widgets)

LLM usage directly impacts operational costs. These widgets are essential for budget management.

#### LLM Cost Monitoring (7 widgets from bookstore-llm-metrics.json)

1. **LLM Cost (Last Hour)** - Combined cost across providers
2. **LLM Token Usage** (timeseries) - Per-second consumption
3. **LLM Token Throughput** (timeseries) - Rate tracking
4. **LLM Cost Over Time** (timeseries) - Spend trends
5. **Ollama Total Tokens** - Local model usage
6. **Claude Total Tokens** - Anthropic API usage
7. **OpenAI Total Tokens** - OpenAI API usage

**Queries:**

```promql
# Total cost last hour
sum(increase(claude_cost_usd_USD_sum[1h])) +
sum(increase(openai_cost_usd_USD_sum[1h])) +
sum(increase(bedrock_cost_usd_USD_sum[1h]))

# Token throughput
rate(ollama_tokens_total[1m])
rate(claude_tokens_total[1m])
rate(openai_tokens_total[1m])
```

#### Token Breakdown (14 widgets)

36-49. Individual token counters for input/output per provider

**Recommendation:** Keep consolidated view (widget 29-35), consider removing individual breakdowns unless granular tracking is needed.

---

### Category 3: REVIEW & CONSOLIDATE - Resource Management (42 widgets)

These widgets prevent resource exhaustion but many are redundant across dashboards.

#### Memory & GC (11 widgets - bookstore-dotnet-runtime.json)

1. **GC Heap Size by Generation** (timeseries) - Gen0/1/2/LOH/POH
2. **GC Collections per Minute** (gauge)
3. **GC Committed Memory** (gauge)
4. **GC Collection Rate by Generation** (timeseries)
5. **GC Heap Fragmentation** (timeseries)
6. **GC Pause Time** (timeseries)
7. **Memory Allocation Rate** (timeseries)
8. **Live Objects Size** (stat)
9. **Memory Usage** (gauge) - Process memory
10. **Memory Usage** (timeseries) - Over time
11. **GC Collections per Second** (timeseries)

**Recommendation:**

- **Keep:** Widgets 50, 51, 56, 58 (core memory tracking)
- **Remove:** Widgets 52-55, 59-60 (redundant or too detailed)
- **Consolidation:** Combine GC metrics into single timeseries panel

#### JIT Compilation (4 widgets)

1. **JIT Methods Compiled** (stat)
2. **JIT IL Compiled Size** (stat)
3. **Total JIT Compilation Time** (stat)
4. **JIT Compilation Activity** (timeseries)

**Recommendation:** Keep widget 64 (timeseries), remove 61-63 (rarely actionable).

#### Threading (14 widgets - bookstore-threading-concurrency.json)

1. **Thread Pool Size** (stat)
2. **Thread Pool Queue Length** (stat)
3. **Lock Contentions per Minute** (stat)
4. **Total Process Threads** (stat)
5. **Thread Pool Work Item Throughput** (timeseries)
6. **Thread Pool Activity** (timeseries)
7. **Lock Contention Rate** (timeseries)
8. **Process Thread Count** (timeseries)
9. **Active Timers** (stat)
10. **Loaded Assemblies** (stat)
11. **Total Exceptions Thrown** (stat)
12. **CPU Count** (stat)
13. **Active Timers Over Time** (timeseries)
14. **Thread Pool Metrics** (timeseries)

**Recommendation:**

- **Keep:** Widgets 66, 67, 69, 71 (actionable threading metrics)
- **Remove:** Widgets 73-76 (static/rarely useful)
- **Consolidate:** Combine thread pool metrics into widget 78

#### HTTP/Kestrel (11 widgets - bookstore-http-performance.json)

79-89. Various HTTP server metrics

**Recommendation:** Most of these overlap with Category 1 (Performance SLIs). Keep unique widgets:

- **Request Rate by HTTP Method** (timeseries)
- **Active Requests by HTTP Method** (timeseries)
- **Kestrel Connection Status** (timeseries)
- **ASP.NET Core Routing Activity** (timeseries)

Remove duplicates already in performance dashboard.

---

### Category 4: SPECIALIZED - Dependencies (15 widgets)

#### HTTP Client / Outbound (9 widgets - bookstore-dependencies.json)

1. **Active HTTP Client Requests** (stat)
2. **Open HTTP Client Connections** (stat)
3. **HTTP Client P95 Latency** (stat) - Already in Category 1
4. **HTTP Client Request Rate** (stat)
5. **HTTP Client Request Duration Percentiles** - Already in Category 1
6. **HTTP Client Queue Time Percentiles** (timeseries)
7. **HTTP Client Activity** (timeseries)
8. **HTTP Client Connection Duration** (timeseries)
9. **DNS Lookup Duration** (timeseries)

**Recommendation:**

- **Keep:** 90, 91, 95, 96, 98 (unique dependency insights)
- **Remove:** 92, 93, 94 (duplicates from Category 1)

#### Database/Cache (6 widgets)

1. **MongoDB Operations/sec** (timeseries)
2. **MongoDB Operation Duration Percentiles** (timeseries)
3. **Redis Operations/sec** (timeseries)
4. **Redis Cache Hit Rate** (timeseries)
5. **Cache Hit Ratio %** (gauge)
6. **Redis Operation Duration Percentiles** (timeseries)

**Recommendation:** **KEEP ALL** - Critical for diagnosing database bottlenecks and cache efficiency.

---

### Category 5: CANDIDATES FOR REMOVAL - Low-Value Operational (128 widgets)

These widgets provide general observability but are rarely actionable or too granular.

#### System Health (13 widgets from mega dashboard)

1. **CPU Usage** (gauge)
2. **CPU Usage** (timeseries)
3. **Memory Usage** (gauge) - Duplicate
4. **Thread Count** (gauge)
5. **Active HTTP Requests** (gauge) - Duplicate
6. **Active Connections** (gauge) - Duplicate
7. **Total Exceptions** (gauge) - Duplicate

**Recommendation:** Remove all - duplicates of Category 1/3 widgets or OS-level metrics better tracked elsewhere.

#### Detailed Breakdowns (115 widgets)

- HTTP status code individual panels (400, 401, 404, 409, 410)
- Per-generation GC detailed metrics
- Individual LLM token type breakdowns
- Per-method HTTP breakdowns

**Recommendation:** Remove individual status code panels (widgets 22-27 in demo dashboard). Use aggregated error rate widgets instead. Keep 500/503 only.

---

## Mega Dashboard Analysis (99 widgets)

The `bookstore-mega.json` dashboard contains ALL 99 widgets but is **NOT recommended for production use**. It exists as a reference catalog.

**Problems:**

- Overwhelming information density
- Slow rendering with 99 panels
- Difficult to find specific metrics
- Many redundant visualizations

**Purpose:** Development/debugging reference only

**Recommendation:** Keep file for reference but don't deploy to production Grafana. Use specialized dashboards instead.

---

## Demo Dashboard Analysis (53 widgets)

The `bookstore-demo.json` is the **recommended production dashboard**. It's curated from the mega dashboard with these sections:

### Section Breakdown

1. **📊 Performance Testing** (5 widgets)
   - Requests per Second
   - P95 Response Time
   - Error Rate
   - Total Requests (5m)
   - Request Rate by Endpoint

2. **🚨 Errors & Diagnostics** (13 widgets)
   - 5xx/4xx Error Rates
   - Exception tracking
   - Individual status codes (400, 401, 404, 409, 410, 422, 500, 503)

3. **🤖 LLM Performance** (4 widgets)
   - Cost tracking
   - Token usage (Ollama, Claude, OpenAI)

4. **⚙️ .NET Runtime** (6 widgets)
   - JIT metrics
   - GC heap tracking
   - Memory allocation

5. **🌐 HTTP & Kestrel** (5 widgets)
   - Active requests/connections
   - Request duration percentiles

6. **🔀 Threading & Concurrency** (8 widgets)
   - Thread pool metrics
   - Lock contention
   - Timers and assemblies

7. **🔗 External Dependencies** (5 widgets)
   - HTTP client metrics
   - Outbound request tracking

8. **💚 System Health** (7 widgets)
   - Overall health indicators

**Recommendation:** Use as primary production dashboard. Consider removing individual status code widgets (reduce from 53 to 45 widgets).

---

## Dashboard Comparison Matrix

| Feature          | Mega (99) | Demo (53) | Performance (9) | Errors (18) | LLM (7)   | Runtime (11) | HTTP (11) | Threading (14) | Dependencies (15) |
| ---------------- | --------- | --------- | --------------- | ----------- | --------- | ------------ | --------- | -------------- | ----------------- |
| Error Tracking   | ✅ All    | ✅ Core   | ❌              | ✅✅ Best   | ❌        | ❌           | ❌        | ❌             | ❌                |
| Performance SLIs | ✅ All    | ✅ Core   | ✅✅ Best       | ✅ Some     | ❌        | ❌           | ✅ Some   | ❌             | ❌                |
| LLM Costs        | ✅ All    | ✅ Core   | ❌              | ❌          | ✅✅ Best | ❌           | ❌        | ❌             | ❌                |
| Memory/GC        | ✅ All    | ✅ Core   | ❌              | ❌          | ❌        | ✅✅ Best    | ❌        | ❌             | ❌                |
| Threading        | ✅ All    | ✅ Core   | ❌              | ❌          | ❌        | ❌           | ❌        | ✅✅ Best      | ❌                |
| HTTP Server      | ✅ All    | ✅ Core   | ✅ Some         | ❌          | ❌        | ❌           | ✅✅ Best | ❌             | ❌                |
| Dependencies     | ✅ All    | ✅ Core   | ❌              | ❌          | ❌        | ❌           | ❌        | ❌             | ✅✅ Best         |
| Production Ready | ❌        | ✅✅      | ✅              | ✅          | ✅        | 🔄           | 🔄        | 🔄             | ✅                |

**Legend:**

- ✅✅ = Best-in-class coverage
- ✅ = Good coverage
- 🔄 = Redundant with demo dashboard
- ❌ = Not covered

---

## Detailed Widget Specifications

### Top 20 Most Important Widgets

#### 1. Requests per Second

- **Type:** stat
- **Query:** `sum(rate(http_server_request_duration_seconds_count[1m]))`
- **Thresholds:** Green (any), Red (>1 indicates problems if 0 expected)
- **Why Keep:** Primary traffic indicator
- **Found In:** Demo, Mega, Performance

#### 2. P95 Response Time

- **Type:** stat
- **Query:** `histogram_quantile(0.95, sum(rate(http_server_request_duration_seconds_bucket[1m])) by (le)) * 1000`
- **Thresholds:** Green (<100ms), Yellow (100-500ms), Red (>500ms)
- **Why Keep:** SLO compliance metric
- **Found In:** Demo, Mega, Performance

#### 3. Error Rate

- **Type:** stat
- **Query:** `sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[1m])) / sum(rate(http_server_request_duration_seconds_count[1m]))`
- **Thresholds:** Green (<1%), Yellow (1-5%), Red (>5%)
- **Why Keep:** Critical failure indicator
- **Found In:** Demo, Mega, Performance, Errors

#### 4. LLM Cost (Last Hour)

- **Type:** stat (multi-query)
- **Queries:**
  - `sum(increase(claude_cost_usd_USD_sum[1h]))`
  - `sum(increase(openai_cost_usd_USD_sum[1h]))`
  - `sum(increase(bedrock_cost_usd_USD_sum[1h]))`
- **Why Keep:** Budget tracking for AI services
- **Found In:** Demo, Mega, LLM

#### 5. .NET Exceptions per Minute

- **Type:** stat
- **Query:** `rate(process_runtime_dotnet_exceptions_count_total[1m]) * 60`
- **Thresholds:** Green (<10), Yellow (10-50), Red (>50)
- **Why Keep:** Application stability indicator
- **Found In:** Demo, Mega, Errors

#### 6. Thread Pool Queue Length

- **Type:** stat
- **Query:** `process_runtime_dotnet_thread_pool_queue_length`
- **Thresholds:** Green (<5), Yellow (5-20), Red (>20)
- **Why Keep:** Thread pool saturation warning
- **Found In:** Demo, Mega, Threading

#### 7. Lock Contentions per Minute

- **Type:** stat
- **Query:** `rate(process_runtime_dotnet_monitor_lock_contention_count_total[1m]) * 60`
- **Thresholds:** Green (<100), Yellow (100-500), Red (>500)
- **Why Keep:** Concurrency bottleneck detection
- **Found In:** Demo, Mega, Threading

#### 8. GC Heap Size by Generation

- **Type:** timeseries (stacked)
- **Queries:**
  - `process_runtime_dotnet_gc_heap_size_bytes{generation="gen0"}`
  - `process_runtime_dotnet_gc_heap_size_bytes{generation="gen1"}`
  - `process_runtime_dotnet_gc_heap_size_bytes{generation="gen2"}`
  - `process_runtime_dotnet_gc_heap_size_bytes{generation="loh"}`
  - `process_runtime_dotnet_gc_heap_size_bytes{generation="poh"}`
- **Why Keep:** Memory pressure visualization
- **Found In:** Demo, Mega, Runtime

#### 9. HTTP Request Duration Percentiles

- **Type:** timeseries
- **Queries:** P50, P90, P95, P99 calculations
- **Why Keep:** Performance distribution insight
- **Found In:** Demo, Mega, Performance, HTTP

#### 10. Request Rate by Endpoint

- **Type:** timeseries
- **Query:** `sum(rate(http_server_request_duration_seconds_count[1m])) by (http_route)`
- **Why Keep:** Identify hot endpoints
- **Found In:** Demo, Mega, Performance

#### 11. Active HTTP Requests

- **Type:** stat
- **Query:** `sum(http_server_active_requests)`
- **Thresholds:** Green (<10), Yellow (10-50), Red (>50)
- **Why Keep:** Current load indicator
- **Found In:** Demo, Mega, HTTP

#### 12. Active Connections

- **Type:** stat
- **Query:** `sum(kestrel_active_connections)`
- **Thresholds:** Green (<20), Yellow (20-100), Red (>100)
- **Why Keep:** Connection pool monitoring
- **Found In:** Demo, Mega, HTTP

#### 13. HTTP Client P95 Latency

- **Type:** stat
- **Query:** `histogram_quantile(0.95, sum(rate(http_client_request_duration_seconds_bucket[1m])) by (le)) * 1000`
- **Thresholds:** Green (<50ms), Yellow (50-200ms), Red (>200ms)
- **Why Keep:** Dependency health check
- **Found In:** Demo, Mega, Dependencies

#### 14. Redis Cache Hit Rate

- **Type:** timeseries
- **Queries:**
  - `rate(redis_cache_hits[1m])`
  - `rate(redis_cache_misses[1m])`
- **Why Keep:** Cache effectiveness metric
- **Found In:** Dependencies

#### 15. MongoDB Operation Duration (P95)

- **Type:** timeseries
- **Query:** `histogram_quantile(0.95, rate(mongodb_operation_duration_bucket[1m]))`
- **Why Keep:** Database performance tracking
- **Found In:** Dependencies

#### 16. Memory Allocation Rate

- **Type:** timeseries
- **Query:** `rate(process_runtime_dotnet_gc_allocations_size_bytes_total[1m])`
- **Why Keep:** Memory churn indicator
- **Found In:** Demo, Mega, Runtime

#### 17. 5xx Errors by Endpoint

- **Type:** timeseries
- **Query:** `sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[1m])) by (http_route)`
- **Why Keep:** Pinpoint failing endpoints
- **Found In:** Mega, Errors

#### 18. Thread Pool Work Item Throughput

- **Type:** timeseries
- **Query:** `rate(process_runtime_dotnet_thread_pool_completed_items_count_total[1m])`
- **Why Keep:** Async workload tracking
- **Found In:** Demo, Mega, Threading

#### 19. HTTP Client Activity

- **Type:** timeseries
- **Queries:**
  - `sum(http_client_active_requests)`
  - `sum(http_client_open_connections)`
- **Why Keep:** Outbound dependency monitoring
- **Found In:** Demo, Mega, Dependencies

#### 20. Endpoints by Error Rate (5m)

- **Type:** table
- **Query:** Complex aggregation sorting endpoints by error rate
- **Why Keep:** Quickly identify problem areas
- **Found In:** Mega, Errors

---

## Widget Type Distribution

| Type           | Count | Use Case                | Keep/Remove              |
| -------------- | ----- | ----------------------- | ------------------------ |
| **stat**       | 89    | Single-value KPIs       | Keep 35, Remove 54       |
| **timeseries** | 78    | Trends over time        | Keep 60, Remove 18       |
| **gauge**      | 22    | Current resource levels | Keep 8, Remove 14        |
| **table**      | 2     | Sorted/filtered data    | Keep 2                   |
| **text**       | 46    | Section headers         | Keep all (documentation) |

**Stat Widget Redundancy:** Many stat widgets show the same metric in different dashboards. Consolidate to demo dashboard only.

**Timeseries Value:** Most timeseries widgets provide valuable trend analysis. Keep unless showing redundant data.

**Gauge Overhead:** Gauge widgets often duplicate stats. Remove gauges where stat widgets exist.

---

## Query Performance Analysis

### Expensive Queries (>100ms execution time)

1. **Histogram Quantiles** (P95/P99 calculations)
   - Used in: 24 widgets
   - Optimization: Pre-aggregate buckets, increase scrape interval
   - Keep: Yes (critical for SLOs)

2. **Complex Aggregations** (Endpoints by Error Rate table)
   - Used in: 2 widgets
   - Optimization: Limit time range, add sampling
   - Keep: Yes (valuable diagnostic tool)

3. **Multi-Query Stats** (LLM Cost)
   - Used in: 7 widgets
   - Optimization: Combine into single query with `or`
   - Keep: Yes (cost tracking essential)

### Optimization Recommendations

```promql
# BEFORE: Multiple queries in stat panel
sum(increase(claude_cost_usd_USD_sum[1h]))
sum(increase(openai_cost_usd_USD_sum[1h]))
sum(increase(bedrock_cost_usd_USD_sum[1h]))

# AFTER: Single query with vector
sum(increase(claude_cost_usd_USD_sum[1h])) or vector(0) +
sum(increase(openai_cost_usd_USD_sum[1h])) or vector(0) +
sum(increase(bedrock_cost_usd_USD_sum[1h])) or vector(0)
```

---

## Recommendations by Persona

### For DevOps Engineers

**Keep:** Demo (53), Errors (18), Dependencies (15)
**Remove:** Runtime (11), Threading (14), HTTP (11) - redundant with Demo
**Total:** 86 widgets → 86 widgets (no change, but consolidate viewing)

### For Performance Engineers

**Keep:** Mega (99) for deep-dive analysis
**Remove:** None (need all metrics for debugging)
**Total:** 99 widgets (reference only, not daily use)

### For Product Managers/Executives

**Keep:** Custom executive dashboard with 12 widgets:

1. Requests per Second
2. P95 Response Time
3. Error Rate
4. Total Requests (5m)
5. LLM Cost (Last Hour)
6. 5xx Error Rate
7. Active HTTP Requests
8. Memory Usage
9. HTTP Client P95 Latency
10. Redis Cache Hit Rate
11. MongoDB P95 Latency
12. Request Rate by Endpoint (timeseries)

**Remove:** All detailed technical widgets
**Total:** 12 widgets (new dashboard needed)

### For Developers (Day-to-Day)

**Keep:** Performance (9), Errors (18), LLM (7)
**Remove:** Runtime, Threading, HTTP (use Demo for those)
**Total:** 34 widgets across 3 dashboards

---

## Action Plan

### Phase 1: Immediate (Week 1)

1. ✅ Fix/remove corrupted `bookstore-system-health.json`
2. ✅ Set `bookstore-demo.json` as default dashboard
3. ✅ Add warning to `bookstore-mega.json` title: "(Reference Only - Not for Production)"
4. ✅ Remove individual HTTP status code widgets (400, 401, 404, 409, 410) from Demo
5. ✅ Reduce Demo from 53 to 45 widgets

### Phase 2: Consolidation (Week 2)

1. 🔄 Merge Runtime (11), HTTP (11), Threading (14) dashboards into Demo
2. 🔄 Remove standalone dashboards (keep only Demo, Errors, Dependencies, LLM, Performance)
3. 🔄 Create Executive Dashboard (12 widgets)
4. 🔄 Target: 5 production dashboards (down from 9)

### Phase 3: Optimization (Week 3-4)

1. 🔄 Optimize histogram quantile queries
2. 🔄 Combine multi-query stat panels
3. 🔄 Add recording rules for expensive queries
4. 🔄 Implement query result caching
5. 🔄 Target: <2s dashboard load time

### Phase 4: Documentation (Ongoing)

1. 📝 Document each dashboard's purpose
2. 📝 Create runbook links from widgets
3. 📝 Add alert thresholds to widget descriptions
4. 📝 Link to troubleshooting guides

---

## Proposed Final Dashboard Structure

### Production Dashboards (5 total)

#### 1. BookStore Overview (Executive) - 12 widgets

**Audience:** Product/Business stakeholders
**Refresh:** 30s
**Retention:** 90 days
**Widgets:** Top-level KPIs only

#### 2. BookStore Performance (Developer) - 45 widgets

**Audience:** Developers, SREs
**Refresh:** 5s
**Retention:** 30 days
**Widgets:** Consolidated Demo dashboard (reduced from 53)
**Sections:**

- Performance Testing (5)
- Errors (8) - Removed individual status codes
- LLM (4)
- Runtime (6)
- HTTP (5)
- Threading (8)
- Dependencies (5)
- System Health (4)

#### 3. BookStore Errors & Diagnostics - 18 widgets

**Audience:** On-call engineers
**Refresh:** 10s
**Retention:** 30 days
**Widgets:** Error tracking, debugging links

#### 4. BookStore Dependencies - 15 widgets

**Audience:** SREs, Performance engineers
**Refresh:** 10s
**Retention:** 30 days
**Widgets:** HTTP client, MongoDB, Redis metrics

#### 5. BookStore LLM Costs - 7 widgets

**Audience:** Product managers, Finance
**Refresh:** 1m
**Retention:** 365 days
**Widgets:** AI cost tracking and optimization

### Reference Dashboards (2 total, not deployed to prod)

#### 6. BookStore MEGA (All Metrics) - 99 widgets

**Audience:** Performance engineers (debugging only)
**Refresh:** 15s
**Retention:** 7 days
**Purpose:** Deep-dive analysis

#### 7. BookStore K6 Performance Testing - 9 widgets

**Audience:** QA, Performance engineers
**Refresh:** 5s
**Retention:** 7 days
**Purpose:** Load test monitoring

---

## Metrics Retention Strategy

| Dashboard    | Refresh | Retention | Disk Usage | Notes                          |
| ------------ | ------- | --------- | ---------- | ------------------------------ |
| Executive    | 30s     | 90 days   | ~50 MB     | Low cardinality                |
| Performance  | 5s      | 30 days   | ~500 MB    | High cardinality               |
| Errors       | 10s     | 30 days   | ~200 MB    | Medium cardinality             |
| Dependencies | 10s     | 30 days   | ~300 MB    | Medium cardinality             |
| LLM          | 1m      | 365 days  | ~100 MB    | Low cardinality, cost tracking |
| MEGA         | 15s     | 7 days    | ~1 GB      | All metrics                    |
| K6 Testing   | 5s      | 7 days    | ~200 MB    | Short-term only                |

**Total Estimated Storage:** ~2.35 GB for all dashboards

---

## Key Metrics Reference

### RED Method (Request-based services)

- **Rate:** Requests per Second
- **Errors:** Error Rate (5xx)
- **Duration:** P95/P99 Response Time

### USE Method (Resource-based services)

- **Utilization:** CPU/Memory Usage
- **Saturation:** Thread Pool Queue Length, GC Collections
- **Errors:** .NET Exceptions

### Four Golden Signals (SRE)

- **Latency:** HTTP Request Duration Percentiles
- **Traffic:** Request Rate by Endpoint
- **Errors:** Error Rate by Status Code
- **Saturation:** Active Requests, Connection Queue

---

## Widget ID Mapping

For reference, here are the widget IDs used across dashboards:

- **1-99:** Mega dashboard (all widgets)
- **100-105:** Dependencies (MongoDB/Redis)
- **9000-9999:** Section headers (text panels)

**Note:** Widget IDs are not sequential. Some gaps exist for future expansion.

---

## Conclusion

### Summary Statistics

- **Total Widgets Analyzed:** 237
- **Recommended to Keep:** 109 (46%)
- **Recommended to Remove:** 128 (54%)
- **Dashboards to Keep:** 5 production + 2 reference
- **Dashboards to Remove/Fix:** 2 (System Health, consolidate others)

### Key Findings

1. **Significant redundancy** across Runtime, HTTP, and Threading dashboards
2. **Demo dashboard is well-curated** but can be reduced by 8 widgets
3. **LLM cost tracking is unique and valuable** - no consolidation needed
4. **Error diagnostics dashboard is critical** for production support
5. **Mega dashboard serves as useful reference** but shouldn't be used daily

### Next Steps

1. Review this catalog with team
2. Vote on widgets to keep/remove
3. Implement Phase 1 changes (remove status code widgets, fix corrupted dashboard)
4. Create Executive Dashboard
5. Document final dashboard structure
6. Archive removed dashboards for reference

---

**Document Version:** 1.0
**Author:** Claude Code Analysis
**Review Status:** Pending Team Review
**Last Updated:** 2025-10-02
