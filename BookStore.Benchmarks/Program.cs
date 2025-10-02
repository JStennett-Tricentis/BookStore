using BenchmarkDotNet.Running;

namespace BookStore.Benchmarks;

/// <summary>
/// Entry point for running BenchmarkDotNet benchmarks.
///
/// Usage:
///   dotnet run -c Release                              # Run all benchmarks
///   dotnet run -c Release --filter *Json*              # Run only JSON benchmarks
///   dotnet run -c Release --filter *StringManipulation* # Run only string benchmarks
///
/// Key Differences: BenchmarkDotNet vs K6
/// ========================================
///
/// BenchmarkDotNet (Micro-benchmarks):
/// - Tests isolated code units (methods, algorithms)
/// - In-process execution - no HTTP overhead
/// - Memory allocation analysis (Gen0, Gen1, Gen2 GC)
/// - JIT/warmup analysis
/// - Statistical rigor (mean, median, stddev, outliers)
/// - Compare different implementations
/// - CPU cache effects, branch prediction
///
/// K6 (Load testing):
/// - Tests HTTP endpoints end-to-end
/// - Simulates realistic user behavior
/// - Network latency included
/// - Concurrent users (100s-1000s)
/// - Production-like scenarios
/// - Multi-step user journeys
///
/// Use BenchmarkDotNet For:
/// - Optimizing hot paths in code
/// - Comparing algorithm implementations
/// - Reducing memory allocations
/// - Finding performance regressions in code changes
///
/// Use K6 For:
/// - API latency and throughput testing
/// - Load and stress testing
/// - Finding bottlenecks in full request/response cycle
/// - Testing under concurrent load
/// </summary>
public class Program
{
    public static void Main(string[] args)
    {
        BenchmarkSwitcher.FromAssembly(typeof(Program).Assembly).Run(args);
    }
}
