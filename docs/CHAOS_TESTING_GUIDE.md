# Chaos Testing Guide

## Overview

The BookStore Chaos Testing system pushes your application to its absolute limits with extreme load patterns, error injection, memory pressure, and concurrent stress across all system components.

## What Makes This EXTREME

### 🔥 Enhanced Load Parameters

Compared to standard chaos testing, this configuration increases:

- **2x more initial data** (100 books vs 50)
- **VU spikes up to 250** (was 120 max)
- **2x LLM bombardment users** (10 vs 5)
- **2x error generators** (8 vs 4)
- **2x memory pressure** (15 VUs, 12 objects/iteration vs 8/7)
- **60% higher database load** (60 VUs vs 35)
- **2x connection saturation** (250 VUs vs 120)
- **67% more thread chaos** (25 VUs vs 15)
- **30% error rate** (vs 20% baseline)
- **25% random error injection** (vs 15%)
- **2x errors per iteration** (5-10 vs 3-6)

### ⏱️ Test Duration

Total test time: **~4 minutes** (245 seconds)

All 7 chaos scenarios run with significant overlap for maximum system stress.

## Quick Start

### 1. Start Services

```bash
make run-aspire
```

### 2. Open Chaos Workspace

```bash
make chaos-workspace
```

This opens 3 tabs:
1. **Performance Dashboard** (http://localhost:7004) - Start the test here
2. **Chaos Grafana Dashboard** (http://localhost:3333/d/bookstore-chaos) - Watch metrics
3. **Aspire Dashboard** (http://localhost:15888) - Monitor service health

### 3. Run Chaos Test

#### Option A: Via Web UI (Recommended)
1. In Performance Dashboard, click **"Start Chaos Test"**
2. Switch to Grafana Chaos Dashboard tab
3. Watch the metrics go WILD!

#### Option B: Via Command Line
```bash
make perf-chaos
```

## What to Watch

### The Chaos Dashboard

The **Chaos Testing Dashboard** ([bookstore-chaos](http://localhost:3333/d/bookstore-chaos)) shows 28 real-time panels organized into 7 rows:

#### ROW 1: Real-Time Chaos Indicators (instant feedback)
- **Active Virtual Users** - Spikes from 1 → 200+ during random spikes
- **HTTP Request Rate** - Wild fluctuations as scenarios start/stop
- **Active Connections** - Connection pool saturation
- **Error Rate %** - Gauge showing error percentage spikes (up to 60%)
- **Response Time P95** - Degradation under extreme load

#### ROW 2: Threading & Concurrency Pressure
- **ThreadPool Queue Length** - Grows during thread chaos
- **Active Threads** - Thread count increases
- **ThreadPool Work Items** - Completion rate
- **Lock Contentions** - Spikes during concurrent operations

#### ROW 3: Memory & GC Chaos
- **Heap Size** - Memory growth during memory pressure scenario
- **GC Collections/sec** - Garbage collection spikes (Gen 0, 1, 2)
- **Memory Allocation Rate** - Bytes/sec allocation rate
- **Gen 2 Collections** - Critical full GC events

#### ROW 4: HTTP & Kestrel Saturation
- **Queued Connections** - Connection queuing when saturated
- **Connection Duration P95** - Time connections are held
- **Rejected Connections** - Connection pool rejections
- **Connection States** - Active/Queued/Current breakdown

#### ROW 5: Database & Dependencies
- **MongoDB Operations/sec** - Database query rate
- **Redis Operations/sec** - Cache operation rate
- **Database Response Time P95** - DB latency under load
- **External HTTP Failures** - Failed external calls

#### ROW 6: Error Breakdown
- **HTTP Status Distribution** - 2xx (green), 4xx (yellow), 5xx (red) over time
- **Error Count by Type** - Individual counts for 400, 401, 404, 409, 500, 503, etc.
- **Exception Rate** - .NET exception frequency

#### ROW 7: LLM Chaos Metrics
- **LLM Requests/sec** - By provider (Ollama, Claude, OpenAI)
- **Token Usage Rate** - Input vs Output tokens
- **LLM Cost Rate** - $/minute
- **LLM P95 Response Time** - By provider

## Chaos Scenarios Explained

### 1. Data Setup (0-45s)
Creates 100 books for testing and primes the cache.

### 2. Random Spikes (45s-138s)
VU pattern: 20 → 100 → 10 → 80 → 15 → 150 → 120 → **200** → 5

**Tests:** HTTP metrics, Kestrel, request routing

### 3. LLM Bombardment (50s-230s)
Constant 10 VUs hitting LLM endpoints for 3 minutes.

**Tests:** LLM metrics, token usage, cost tracking, API latency

### 4. Error Chaos (48s-228s)
8 VUs continuously generating errors (400, 401, 404, 409, 500, 503, etc.)

**Tests:** Error dashboards, exception handling, HTTP status tracking

### 5. Memory Pressure (55s-205s)
15 VUs creating 12 objects per iteration + 25 rapid cache GETs.

**Tests:** GC metrics, heap growth, memory allocation, cache pressure

### 6. Database Chaos (52s-127s)
VU pattern: 25 → 60 → 45 → 10

Heavy pagination, complex queries, rapid cache hits.

**Tests:** MongoDB throughput, Redis operations, external dependencies

### 7. Connection Chaos (50s-103s)
VU pattern: 200 → 180 → **250** → 10

Each VU fires 25 concurrent batch requests.

**Tests:** Connection pool saturation, queued connections, Kestrel metrics

### 8. Thread Chaos (58s-193s)
25 VUs with 50 rapid requests and 35 batch requests each.

**Tests:** Thread pool queue, active threads, lock contention, work item completion

## Expected Behavior

### Normal Metrics (Before Test)
- VUs: 0-1
- Request rate: 0-10/sec
- Error rate: <1%
- Response time P95: <100ms
- Memory: Stable ~50-100MB
- Connections: 1-5 active

### Chaos Metrics (During Test)
- VUs: Up to **250 concurrent users**
- Request rate: **500-2000+/sec**
- Error rate: **20-60%** (intentional)
- Response time P95: **500ms - 10s+**
- Memory: Growing to **500MB - 1GB+**
- Connections: **50-200+** active, **queued**, or **rejected**
- GC: Frequent Gen 0/1, occasional Gen 2
- ThreadPool: Queue length **50-500+**
- Lock contentions: **10-100+/sec**
- Errors: All types (400, 401, 404, 409, 500, 503, etc.)

## Configuration

### Modify Chaos Intensity

Edit [`BookStore.Performance.Tests/config/chaos-config.js`](../BookStore.Performance.Tests/config/chaos-config.js):

```javascript
export const chaosConfig = {
    // ==================== DATA SETUP ====================
    dataSetup: {
        numberOfBooks: 100,  // ← Increase for more initial data
        maxDuration: "45s",
    },

    // ==================== RANDOM SPIKES ====================
    randomSpikes: {
        stages: [
            { duration: "5s", target: 200 },  // ← Higher spike!
            // ...
        ],
    },

    // ==================== BEHAVIOR SETTINGS ====================
    behavior: {
        successRate: 0.7,        // ← Lower = more failures
        randomErrorRate: 0.25,   // ← Higher = more chaos
        errorsPerIteration: { min: 5, max: 10 },  // ← More errors
    },

    // ==================== THRESHOLDS ====================
    thresholds: {
        maxErrorRate: 0.6,           // ← Allow 60% errors
        p95ResponseTime: 45000,      // ← 45 second timeout
    },
};
```

### Dashboard Customization

The dashboard is at [`monitoring/grafana/dashboards/bookstore-chaos.json`](../monitoring/grafana/dashboards/bookstore-chaos.json).

Default settings:
- **Time range:** Last 5 minutes (to see rapid changes)
- **Refresh:** 5 seconds
- **Datasource:** Prometheus

## Makefile Commands

```bash
# Open chaos workspace (Dashboard + Grafana + Aspire)
make chaos-workspace

# Run chaos test from CLI
make perf-chaos

# Open just the Chaos dashboard
make grafana-chaos

# Open all dashboards including chaos
make grafana-dashboards
```

## Troubleshooting

### Services Die During Chaos

**This is expected!** You're testing system limits.

If services crash:
1. Check Aspire Dashboard for which service failed
2. Review logs: `make logs-bookstore` or `make logs-performance`
3. Reduce intensity in `chaos-config.js`
4. Restart: `make restart`

### No Metrics Showing

**Wait 30-45 seconds** for data setup to complete, then check:

```bash
# Verify services are running
make status

# Check Prometheus is scraping
open http://localhost:9090/targets

# Check Aspire Dashboard
make aspire-dashboard
```

### Dashboard Shows "No Data"

1. Ensure test is running: Check Performance Dashboard (http://localhost:7004)
2. Verify time range: Set to "Last 5 minutes"
3. Check Prometheus query: Click panel title → Edit → Check query syntax
4. Restart Grafana: `docker restart bookstore-grafana`

### Too Much Chaos!

Reduce settings in `chaos-config.js`:

```javascript
// Lower VUs
connectionChaos: {
    stages: [
        { duration: "10s", target: 50 },  // Was 200
    ],
},

// Reduce errors
behavior: {
    randomErrorRate: 0.1,  // Was 0.25
    errorsPerIteration: { min: 1, max: 3 },  // Was 5-10
},
```

## Success Criteria

After a chaos test, you should see:

✅ **All 7 scenarios executed** (check K6 summary output)
✅ **Metrics spiked visibly** in all dashboard rows
✅ **Services recovered** after test completion
✅ **No permanent failures** (temporary errors OK)
✅ **HTML report generated** in `BookStore.Performance.Tests/results/`

## Related Documentation

- [Makefile Commands](MAKEFILE_COMMANDS.md) - All available commands
- [Performance Testing](../CLAUDE.md#performance-testing) - Standard load testing
- [Grafana Dashboards](../CLAUDE.md#grafana-dashboards) - All dashboard descriptions
- [Chaos Config](../BookStore.Performance.Tests/config/chaos-config.js) - Configuration reference

## Tips for Best Results

1. **Clean Start**: Run `make reset` before chaos testing for clean baseline
2. **Monitor All Three Dashboards**: Keep tabs open for Performance Dashboard, Chaos Dashboard, and Aspire
3. **Screenshot the Peaks**: Capture the dashboard when VUs hit 200+ and metrics spike
4. **Review HTML Report**: Check `BookStore.Performance.Tests/results/` for detailed breakdown
5. **Compare to Baseline**: Run `make perf-smoke` first to establish normal metrics

---

**Remember:** Chaos testing is about **finding limits**, not staying within them. Embrace the chaos! 🌪️
