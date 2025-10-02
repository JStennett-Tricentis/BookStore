using System.Text.Json.Serialization;

namespace BookStore.Performance.Service.Models;

public enum TestScenarioType
{
    Smoke,
    Load,
    Stress,
    Spike,
    Soak,
    Volume
}

public enum TestStatus
{
    Queued,
    Starting,
    Running,
    Completed,
    Failed,
    Cancelled
}

public class K6TestRequest
{
    public string TestName { get; set; } = string.Empty;
    public TestScenarioType Scenario { get; set; } = TestScenarioType.Load;
    public string TestScript { get; set; } = "tests/books.js";
    public Dictionary<string, string> Environment { get; set; } = new();
    public K6TestOptions Options { get; set; } = new();
    public string? UserEmail { get; set; }
    public string? TenantName { get; set; }
}

public class K6TestOptions
{
    public int VirtualUsers { get; set; } = 10;
    public string Duration { get; set; } = "5m";
    public Dictionary<string, object> Thresholds { get; set; } = new();
    public bool InsecureSkipTLSVerify { get; set; } = false;
    public string? OutputFormat { get; set; }
}

public class K6TestResponse
{
    public string TestId { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public TestStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ContainerId { get; set; }
    public string? ErrorMessage { get; set; }
    public K6TestResults? Results { get; set; }
}

public class K6TestResults
{
    public Dictionary<string, MetricData> Metrics { get; set; } = new();
    public List<K6Check> Checks { get; set; } = new();
    public TestThresholdResults Thresholds { get; set; } = new();
}

public class MetricData
{
    public string Type { get; set; } = string.Empty;
    public bool Contains { get; set; }
    public Dictionary<string, double> Values { get; set; } = new();
}

public class K6Check
{
    public string Name { get; set; } = string.Empty;
    public int Passes { get; set; }
    public int Fails { get; set; }
    public double SuccessRate => Passes + Fails > 0 ? (double)Passes / (Passes + Fails) * 100 : 0;
}

public class TestThresholdResults
{
    public Dictionary<string, ThresholdResult> Results { get; set; } = new();
    public bool AllPassed => Results.Values.All(r => r.Ok);
}

public class ThresholdResult
{
    public bool Ok { get; set; }
    public double ObservedValue { get; set; }
}

public class K6TestStatus
{
    public string TestId { get; set; } = string.Empty;
    public TestStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Data { get; set; } = new();
}

public class RunningK6Test
{
    public string TestId { get; set; } = string.Empty;
    public string TestName { get; set; } = string.Empty;
    public K6TestRequest Request { get; set; } = new();
    public TestStatus Status { get; set; } = TestStatus.Queued;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? ContainerId { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> LogOutput { get; set; } = new();
    public K6TestResults? Results { get; set; }
}
