# 🔥 EXTREME Chaos Testing

## ⚠️ WARNING

**This test is DESIGNED TO BREAK YOUR SYSTEM!**

Use EXTREME chaos testing to find absolute limits, breaking points, and catastrophic failure modes. This is NOT for regular testing - it WILL cause service degradation and crashes.

## Quick Start

```bash
# Run EXTREME chaos test (requires confirmation)
make perf-extreme

# You'll be prompted:
# Are you sure? This WILL stress test to failure. (yes/no):
```

## What Makes This EXTREME

### Compared to Standard Chaos Testing

| Metric | Standard Chaos | EXTREME Chaos | Multiplier |
|--------|----------------|---------------|------------|
| **Initial Books** | 100 | 250 | 2.5x |
| **Peak VUs** | 250 | **700** | 2.8x |
| **LLM Users** | 10 | **25** | 2.5x |
| **Error Generators** | 8 | **20** | 2.5x |
| **Memory VUs** | 15 | **35** | 2.3x |
| **Objects/Iteration** | 12 | **25** | 2.1x |
| **Rapid GETs** | 25 | **50** | 2x |
| **Database Peak VUs** | 60 | **200** | 3.3x |
| **Connection Peak VUs** | 250 | **700** | 2.8x |
| **Batch Size** | 25 | **50** | 2x |
| **Thread VUs** | 25 | **60** | 2.4x |
| **Success Rate** | 70% | **50%** | Lower |
| **Error Rate** | 25% random | **40% random** | Higher |
| **Errors/Iteration** | 5-10 | **10-20** | 2x |
| **Max Error Threshold** | 60% | **80%** | Higher |
| **Duration** | ~4 min | **~6 min** | 1.5x |

### The Numbers

- **700 concurrent VUs** at peak (connection chaos spike)
- **500 VUs** sustained during random spikes
- **250 initial books** created (massive dataset)
- **80% error tolerance** (system expected to fail heavily)
- **50% success rate** (half of all operations intentionally fail)
- **40% random error injection** (chaos injected into every scenario)
- **10-20 errors per iteration** in error chaos scenario
- **6-minute duration** of overlapping extreme stress

## Test Scenarios

### 1. Data Setup (0-90s)
Creates **250 books** with large descriptions (5,000 chars each).

### 2. Random Spikes (90s-251s)
VU pattern: 50 → 200 → 20 → 250 → 50 → **350** → 150 → **500** → 300 → 400 → 10

**Peak:** 500 VUs hammering all CRUD operations

### 3. LLM Bombardment (95s-395s)
**25 constant VUs** hitting LLM endpoints for 5 minutes with 3,000-char descriptions.

### 4. Error Chaos (92s-392s)
**20 VUs** firing 10-20 errors per iteration for 5 minutes.

### 5. Memory Pressure (100s-340s)
**35 VUs** creating 25 objects + 50 rapid GETs per iteration.

### 6. Database Chaos (98s-228s)
VU pattern: 50 → 150 → 120 → **200** → 10

**Peak:** 200 VUs flooding MongoDB/Redis

### 7. Connection Chaos (95s-189s) 🔥
VU pattern: **400** → 350 → **600** → 450 → **700** → 10

**Peak:** 700 VUs with 50 concurrent requests each = 35,000 parallel connections!

### 8. Thread Chaos (105s-345s)
**60 VUs** with 100 rapid requests + 75 batch operations each.

## Expected Behavior

### 🔥 System WILL Experience:

- ✅ **Service Crashes** - dotnet processes may crash
- ✅ **Connection Rejections** - Connection pool exhausted
- ✅ **Timeouts** - 2-minute response times allowed
- ✅ **Memory Exhaustion** - GC unable to keep up
- ✅ **Thread Pool Saturation** - All threads consumed
- ✅ **Database Lockups** - MongoDB/Redis overwhelmed
- ✅ **80%+ Error Rates** - Intentional failure mode
- ✅ **Complete System Failure** - Everything may crash

### Metrics During EXTREME Chaos

| Metric | Normal | Standard Chaos | EXTREME Chaos |
|--------|--------|----------------|---------------|
| VUs | 0-10 | 0-250 | **0-700** |
| Requests/sec | 10-100 | 500-2000 | **2000-10,000+** |
| Error Rate | <1% | 20-60% | **50-80%** |
| Response P95 | <100ms | 500ms-10s | **10s-120s** |
| Memory | 50-100MB | 500MB-1GB | **1GB-4GB+** |
| Connections | 1-10 | 50-200 | **200-1000+** |
| Thread Queue | 0-10 | 50-500 | **500-5000+** |

## Configuration

**File:** `BookStore.Performance.Tests/config/extreme-chaos-config.js`

### Customize Intensity

```javascript
export const extremeChaosConfig = {
    // Make it even MORE extreme
    connectionChaos: {
        stages: [
            { duration: "5s", target: 1000 },  // 1000 VUs!
        ],
        batchSize: 100,  // 100,000 parallel requests!
    },

    behavior: {
        successRate: 0.3,  // Only 30% success
        randomErrorRate: 0.6,  // 60% error injection
    },
};
```

## Safety Recommendations

### ⚠️ DO:
- ✅ Run in **isolated environment** only
- ✅ Monitor closely with Aspire Dashboard
- ✅ Have **recovery plan** ready
- ✅ Save work before running
- ✅ Close other applications
- ✅ Document breaking points found

### ❌ DON'T:
- ❌ Run on production
- ❌ Run on shared dev environment
- ❌ Run without monitoring
- ❌ Run during important work
- ❌ Run without backups
- ❌ Assume system will survive

## Running the Test

### Full Workflow

```bash
# 1. Start services
make run-aspire

# 2. Open chaos workspace (3 tabs)
make chaos-workspace

# 3. Run EXTREME test (with confirmation)
make perf-extreme
# Type: yes

# 4. Watch the chaos dashboard
#    - Metrics will spike to extremes
#    - Errors will flood in
#    - Services may crash
#    - System may become unresponsive

# 5. Generate report (if system survived)
make perf-report-latest

# 6. Recovery (if needed)
make restart
# or
./BookStore.Aspire.AppHost/clean-start.sh
```

### What to Watch

In the **Chaos Dashboard**, you'll see:

1. **VUs spike to 700** (connection chaos)
2. **Request rate hits 5,000-10,000/sec**
3. **Error rate climbs to 80%**
4. **Response times exceed 60 seconds**
5. **Memory grows to 2-4GB+**
6. **Thread queue length hits 1000+**
7. **Connection pool rejects connections**
8. **GC collections become continuous**
9. **Database response times 10x normal**
10. **Services may crash and restart**

## Interpreting Results

### Success Criteria (for EXTREME test)

✅ **System survived the test** (even if degraded)
✅ **Breaking points identified**
✅ **Failure modes documented**
✅ **Recovery time measured**
✅ **Resource limits discovered**
✅ **Error handling validated under duress**

### Finding Breaking Points

The EXTREME test helps you find:

- **Connection limits** - How many before rejections?
- **Thread pool limits** - When does it saturate?
- **Memory limits** - When does GC fail?
- **Database limits** - When does MongoDB/Redis fail?
- **Error handling limits** - Does logging break the system?
- **Recovery capability** - Can system recover after stress?

## Troubleshooting

### Services Crashed During Test

**This is expected!** EXTREME chaos is designed to break things.

```bash
# Check what crashed
make aspire-dashboard

# Restart everything
make restart

# Check logs
make logs-bookstore
```

### System Completely Frozen

**Kill everything and restart:**

```bash
# Terminal 1: Kill K6
pkill -f k6

# Terminal 2: Kill Aspire
pkill -f "dotnet.*Aspire"

# Terminal 3: Clean restart
make reset
make run-aspire
```

### "Too Many Open Files" Error

Your system hit file descriptor limit:

```bash
# macOS: Increase limit
ulimit -n 10000

# Restart services
make restart
```

### Docker Out of Resources

```bash
# Clean Docker
make docker-clean

# Restart
make run-aspire
```

## Comparison: Standard vs EXTREME

| Feature | Standard Chaos | EXTREME Chaos |
|---------|---------------|---------------|
| **Purpose** | Test resilience | **Find breaking points** |
| **Environment** | Dev/Staging | **Isolated only** |
| **Expected Result** | System survives | **System breaks** |
| **Error Rate** | 20-60% | **50-80%** |
| **Peak VUs** | 250 | **700** |
| **Duration** | 4 min | **6 min** |
| **Recovery** | Automatic | **Manual may be needed** |
| **Use Case** | Regular testing | **Limit discovery** |

## When to Use EXTREME

Use EXTREME chaos testing when you need to:

- 🎯 Find **absolute system limits**
- 🎯 Validate **catastrophic failure handling**
- 🎯 Test **disaster recovery** procedures
- 🎯 Benchmark **maximum theoretical capacity**
- 🎯 Identify **cascading failure** patterns
- 🎯 Demonstrate **system resilience** to stakeholders
- 🎯 Justify **infrastructure upgrades**

## Example Output

```bash
$ make perf-extreme

🔥🔥🔥 WARNING: EXTREME CHAOS TEST 🔥🔥🔥
This test is DESIGNED TO BREAK YOUR SYSTEM!

Peak load: 700 concurrent VUs
Error rate: 50-80%
Duration: ~6 minutes
Expected: Service degradation, crashes, resource exhaustion

Are you sure? This WILL stress test to failure. (yes/no): yes

🔥 Starting EXTREME chaos test...

running (06m04.5s), 000/700 VUs, 3450912 complete and 0 interrupted iterations
...
✓ EXTREME chaos complete (if system survived). Generating report...
📊 Opening report: results/extreme-chaos-20251008-214500.html
```

---

**Remember:** EXTREME chaos testing is a tool for finding limits, not for regular validation. Use responsibly! 🔥
