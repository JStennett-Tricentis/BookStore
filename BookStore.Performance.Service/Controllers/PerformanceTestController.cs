using BookStore.Performance.Service.Models;
using BookStore.Performance.Service.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Performance.Service.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class PerformanceTestController : ControllerBase
{
    private readonly IK6OrchestrationService _k6Service;
    private readonly ILogger<PerformanceTestController> _logger;

    public PerformanceTestController(
        IK6OrchestrationService k6Service,
        ILogger<PerformanceTestController> logger)
    {
        _k6Service = k6Service;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<ActionResult<K6TestResponse>> StartTest([FromBody] K6TestRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.TestName))
            {
                return BadRequest("Test name is required");
            }

            var testId = await _k6Service.StartTestAsync(request);
            var testStatus = await _k6Service.GetTestStatusAsync(testId);

            if (testStatus == null)
            {
                return StatusCode(500, "Failed to start test");
            }

            return CreatedAtAction(
                nameof(GetTestStatus),
                new { testId },
                testStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting performance test: {Error}", ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{testId}")]
    public async Task<ActionResult<K6TestResponse>> GetTestStatus(string testId)
    {
        try
        {
            var testStatus = await _k6Service.GetTestStatusAsync(testId);

            if (testStatus == null)
            {
                return NotFound($"Test {testId} not found");
            }

            return Ok(testStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting test status for {TestId}: {Error}", testId, ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{testId}/cancel")]
    public async Task<ActionResult> CancelTest(string testId)
    {
        try
        {
            var cancelled = await _k6Service.CancelTestAsync(testId);

            if (!cancelled)
            {
                return BadRequest("Test could not be cancelled. It may not exist or already be completed.");
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling test {TestId}: {Error}", testId, ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("running")]
    public async Task<ActionResult<IEnumerable<K6TestResponse>>> GetRunningTests()
    {
        try
        {
            var runningTests = await _k6Service.GetRunningTestsAsync();
            return Ok(runningTests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting running tests: {Error}", ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{testId}/results")]
    public async Task<ActionResult<K6TestResults>> GetTestResults(string testId)
    {
        try
        {
            var results = await _k6Service.GetTestResultsAsync(testId);

            if (results == null)
            {
                return NotFound($"Results for test {testId} not found or not yet available");
            }

            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting test results for {TestId}: {Error}", testId, ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{testId}/logs")]
    public async Task<ActionResult<string>> GetTestLogs(string testId)
    {
        try
        {
            var logs = await _k6Service.GetTestLogsAsync(testId);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting test logs for {TestId}: {Error}", testId, ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("cleanup")]
    public async Task<ActionResult> CleanupCompletedTests()
    {
        try
        {
            await _k6Service.CleanupCompletedTestsAsync();
            return Ok(new { message = "Cleanup completed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cleanup: {Error}", ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("scenarios")]
    public ActionResult<IEnumerable<object>> GetAvailableScenarios()
    {
        var scenarios = Enum.GetValues<TestScenarioType>()
            .Select(s => new
            {
                Name = s.ToString(),
                Value = (int)s,
                Description = GetScenarioDescription(s)
            })
            .ToList();

        return Ok(scenarios);
    }

    [HttpPost("quick-start/{scenario}")]
    public async Task<ActionResult<K6TestResponse>> StartQuickTest(TestScenarioType scenario)
    {
        try
        {
            var request = new K6TestRequest
            {
                TestName = $"Quick {scenario} Test - {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}",
                Scenario = scenario,
                TestScript = "tests/books.js",
                Environment = new Dictionary<string, string>
                {
                    ["ENVIRONMENT"] = "local",
                    ["SCENARIO"] = scenario.ToString().ToLower()
                },
                Options = GetDefaultOptionsForScenario(scenario)
            };

            var testId = await _k6Service.StartTestAsync(request);
            var testStatus = await _k6Service.GetTestStatusAsync(testId);

            if (testStatus == null)
            {
                return StatusCode(500, "Failed to start test");
            }

            return CreatedAtAction(
                nameof(GetTestStatus),
                new { testId },
                testStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting quick test: {Error}", ex.Message);
            return StatusCode(500, "Internal server error");
        }
    }

    private static string GetScenarioDescription(TestScenarioType scenario)
    {
        return scenario switch
        {
            TestScenarioType.Smoke => "Basic functionality test with minimal load (1-2 users)",
            TestScenarioType.Load => "Normal expected load test (5-10 users)",
            TestScenarioType.Stress => "High load test to find breaking point (10-30 users)",
            TestScenarioType.Spike => "Sudden load increase test (burst to 50+ users)",
            TestScenarioType.Soak => "Extended duration test to find memory leaks",
            TestScenarioType.Volume => "Large data volume test",
            _ => "Unknown scenario type"
        };
    }

    private static K6TestOptions GetDefaultOptionsForScenario(TestScenarioType scenario)
    {
        return scenario switch
        {
            TestScenarioType.Smoke => new K6TestOptions
            {
                VirtualUsers = 2,
                Duration = "2m",
                Thresholds = new Dictionary<string, object>
                {
                    ["http_req_duration"] = new[] { "p(95)<3000", "p(99)<5000" },
                    ["http_req_failed"] = new[] { "rate<0.05" }
                }
            },
            TestScenarioType.Load => new K6TestOptions
            {
                VirtualUsers = 10,
                Duration = "5m",
                Thresholds = new Dictionary<string, object>
                {
                    ["http_req_duration"] = new[] { "p(95)<2000", "p(99)<3000" },
                    ["http_req_failed"] = new[] { "rate<0.01" }
                }
            },
            TestScenarioType.Stress => new K6TestOptions
            {
                VirtualUsers = 30,
                Duration = "10m",
                Thresholds = new Dictionary<string, object>
                {
                    ["http_req_duration"] = new[] { "p(95)<5000", "p(99)<10000" },
                    ["http_req_failed"] = new[] { "rate<0.05" }
                }
            },
            TestScenarioType.Spike => new K6TestOptions
            {
                VirtualUsers = 50,
                Duration = "3m",
                Thresholds = new Dictionary<string, object>
                {
                    ["http_req_duration"] = new[] { "p(95)<10000", "p(99)<15000" },
                    ["http_req_failed"] = new[] { "rate<0.10" }
                }
            },
            _ => new K6TestOptions()
        };
    }
}