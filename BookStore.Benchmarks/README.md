# BookStore Benchmarks - BenchmarkDotNet

Micro-benchmarking suite for performance testing at the code level, complementing K6's HTTP-level load tests.

## 🎯 When to Use BenchmarkDotNet vs K6

### Use **BenchmarkDotNet** When You Want To

- ✅ **Optimize algorithm implementations** - Compare different approaches (e.g., StringBuilder vs string.Create)
- ✅ **Reduce memory allocations** - Find and eliminate GC pressure hotspots
- ✅ **Test isolated code units** - Benchmark a single method without HTTP overhead
- ✅ **Compare library versions** - See performance impact of upgrading dependencies
- ✅ **Measure JIT effects** - Understand warmup behavior and steady-state performance
- ✅ **Find regressions** - Detect performance degradation in code changes

### Use **K6** When You Want To

- ✅ **Test API endpoints end-to-end** - Full HTTP request/response cycle
- ✅ **Simulate concurrent users** - 100s-1000s of virtual users
- ✅ **Measure API latency** - Real-world network conditions
- ✅ **Load test** - Find system breaking points
- ✅ **Test user journeys** - Multi-step scenarios with sessions

## 📊 Example Use Cases for This Project

| Scenario                               | BenchmarkDotNet                       | K6                  |
| -------------------------------------- | ------------------------------------- | ------------------- |
| **Optimize JSON serialization**        | ✅ Test `JsonSerializer` options      | ❌ Too low-level    |
| **Compare ISBN formatting algorithms** | ✅ Benchmark different string methods | ❌ Not HTTP-related |
| **Test MongoDB query performance**     | ✅ Direct driver calls, no HTTP       | ⚠️ Can test via API |
| **Measure Redis cache hit/miss**       | ✅ In-process cache operations        | ⚠️ Can test via API |
| **API endpoint throughput**            | ❌ No HTTP testing                    | ✅ Realistic load   |
| **Concurrent user simulation**         | ❌ Single-threaded focus              | ✅ Built for this   |

## 🚀 Quick Start

```bash
# Run all benchmarks
make bench

# Run specific benchmark categories
make bench-json         # JSON serialization benchmarks only
make bench-string       # String manipulation benchmarks only

# Run with custom filter
make bench FILTER='*Json*'
make bench FILTER='*FormatIsbn*'

# Run with memory profiler
make bench-memory

# View results
make bench-report       # Open HTML reports in browser
make bench-results      # List available report files
make bench-clean        # Clean all benchmark artifacts
```

## 📁 Available Benchmarks

### 1. **JsonSerializationBenchmarks** ([JsonSerializationBenchmarks.cs](JsonSerializationBenchmarks.cs))

Compares different JSON serialization approaches for Book entities.

**Why this matters:** JSON serialization happens on every API request/response. Optimizing this can improve throughput significantly.

**What it tests:**

- System.Text.Json with custom options vs default options
- Serialization vs deserialization performance
- Round-trip (serialize + deserialize) cost
- Memory allocations per operation

**Example output:**

```text
|                    Method |      Mean | Allocated |
|-------------------------- |----------:|----------:|
| Serialize_SystemTextJson  |   1.234 μs|     520 B |
| Deserialize_SystemTextJson|   1.456 μs|     688 B |
| RoundTrip                 |   2.890 μs|   1,208 B |
```

### 2. **StringManipulationBenchmarks** ([StringManipulationBenchmarks.cs](StringManipulationBenchmarks.cs))

Compares ISBN formatting algorithms.

**Why this matters:** String operations are common in API processing. Choosing the right approach can reduce CPU and memory usage.

**What it tests:**

- String concatenation vs StringBuilder vs string.Create
- Bulk operations (formatting 100 ISBNs)
- Memory allocations (Gen0 GC pressure)

**Example output:**

```text
|                        Method |      Mean | Allocated |
|------------------------------ |----------:|----------:|
| FormatIsbn_StringCreate       |    45.2 ns|       0 B |  ← Zero allocations!
| FormatIsbn_StringBuilder      |    67.8 ns|      32 B |
| FormatIsbn_StringConcat       |   123.4 ns|     120 B |
```

**Key insight:** `string.Create` is 2.7x faster and allocates zero memory!

## 📈 Reading Benchmark Results

### Key Metrics

1. **Mean** - Average execution time (lower is better)
   - ns (nanoseconds) - 0.000000001 seconds
   - μs (microseconds) - 0.000001 seconds
   - ms (milliseconds) - 0.001 seconds

2. **Allocated** - Memory allocated per operation (lower is better)
   - Shows GC pressure
   - 0 B means zero heap allocations (best!)

3. **Rank** - Relative ranking (1 is fastest)

4. **Ratio** - Comparison to baseline (1.00 is baseline)

### Statistical Rigor

BenchmarkDotNet automatically handles:

- ✅ **Warmup iterations** - JIT compilation complete before measuring
- ✅ **Multiple invocations** - Statistical confidence (mean, median, stddev)
- ✅ **Outlier detection** - Ignores anomalies (GC pauses, OS interrupts)
- ✅ **Pilot experiments** - Auto-determines iteration count

## 🛠️ Creating Your Own Benchmarks

### 1. Create a Benchmark Class

```csharp
using BenchmarkDotNet.Attributes;

[MemoryDiagnoser]  // Shows memory allocations
[RankColumn]       // Ranks results
public class MyBenchmarks
{
    private MyData _data;

    [GlobalSetup]  // Runs once before all benchmarks
    public void Setup()
    {
        _data = new MyData();
    }

    [Benchmark(Baseline = true)]  // This is the baseline (Ratio = 1.00)
    public int OldApproach()
    {
        // Your current implementation
        return _data.Process();
    }

    [Benchmark]
    public int NewApproach()
    {
        // Your optimized implementation
        return _data.ProcessOptimized();
    }
}
```

### 2. Run Your Benchmark

```bash
cd BookStore.Benchmarks
dotnet run -c Release -- --filter *MyBenchmarks*
```

### 3. Analyze Results

Look for:

- **Mean time reduction** - How much faster is the new approach?
- **Allocated memory** - Does it reduce GC pressure?
- **Rank** - Is it consistently faster across runs?

## 🎓 Best Practices

### DO

- ✅ Always run benchmarks in **Release mode** (`-c Release`)
- ✅ Use `[MemoryDiagnoser]` to track allocations
- ✅ Mark one method as `[Benchmark(Baseline = true)]`
- ✅ Use `[GlobalSetup]` for expensive initialization
- ✅ Test realistic data sizes (not toy examples)
- ✅ Run on representative hardware (same as production)

### DON'T

- ❌ Don't benchmark in Debug mode (10x slower!)
- ❌ Don't forget to await async methods
- ❌ Don't include I/O in benchmarks (use mocks)
- ❌ Don't benchmark HTTP calls (use K6 instead)
- ❌ Don't trust single runs (BenchmarkDotNet handles this)

## 🔗 Integration with K6

Use both tools together for complete performance coverage:

```text
Developer Workflow:
┌─────────────────────────────────────────────────────────┐
│ 1. Write code                                           │
│ 2. Benchmark with BenchmarkDotNet (optimize algorithms)│
│ 3. Test with K6 (verify API performance)               │
│ 4. Profile with .NET diagnostics (if needed)           │
│ 5. Deploy to production                                 │
└─────────────────────────────────────────────────────────┘
```

**Example:** You optimize JSON serialization with BenchmarkDotNet (reduce from 2μs to 1μs), then verify with K6 that API latency improved (250ms → 200ms).

## 📚 Further Reading

- [BenchmarkDotNet Documentation](https://benchmarkdotnet.org/)
- [Performance Best Practices in .NET](https://learn.microsoft.com/en-us/dotnet/core/performance/)
- [K6 Documentation](https://k6.io/docs/)

## 🤝 Contributing Benchmarks

When adding new benchmarks:

1. Focus on **real bottlenecks** found in profiling
2. Include **clear comments** explaining why it matters
3. Provide **context** about when to use each approach
4. Test **multiple implementations** (not just one)
5. Document **expected results** and insights

## 💡 Example: Finding a Real Bottleneck

```bash
# 1. Profile your code (find slow methods)
dotnet trace collect --process-id <pid>

# 2. Identify hot path (e.g., Book.CalculateDiscount)
# Method appears in 45% of samples!

# 3. Create benchmark comparing approaches
cd BookStore.Benchmarks

# 4. Run benchmark
dotnet run -c Release -- --filter *Discount*

# 5. Results show NewApproach is 3x faster
# Allocated: 120B → 0B (zero allocations!)

# 6. Verify with K6
cd ../BookStore.Performance.Tests
k6 run tests/books.js

# 7. Confirmed: API latency improved 50ms!
```

---

**Remember:** BenchmarkDotNet answers "How fast is my code?" while K6 answers "How fast is my API?"

Use both for complete performance coverage! 🚀
