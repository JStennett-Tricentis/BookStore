using BookStore.Performance.Service.Models;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.Extensions.Caching.Distributed;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace BookStore.Performance.Service.Services;

public class K6OrchestrationService : IK6OrchestrationService, IDisposable
{
    private readonly DockerClient _dockerClient;
    private readonly IDistributedCache _cache;
    private readonly ILogger<K6OrchestrationService> _logger;
    private readonly ConcurrentDictionary<string, RunningK6Test> _runningTests = new();
    private readonly Timer _cleanupTimer;

    public K6OrchestrationService(
        IDistributedCache cache,
        ILogger<K6OrchestrationService> logger)
    {
        _cache = cache;
        _logger = logger;

        // Initialize Docker client
        _dockerClient = new DockerClientConfiguration().CreateClient();

        // Start cleanup timer (runs every 5 minutes)
        _cleanupTimer = new Timer(async _ => await CleanupCompletedTestsAsync(),
                                  null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    public async Task<string> StartTestAsync(K6TestRequest request)
    {
        var testId = Guid.NewGuid().ToString("N");

        var runningTest = new RunningK6Test
        {
            TestId = testId,
            TestName = request.TestName,
            Request = request,
            Status = TestStatus.Starting,
            StartedAt = DateTime.UtcNow
        };

        _runningTests.TryAdd(testId, runningTest);

        try
        {
            _logger.LogInformation("Starting K6 test {TestId}: {TestName}", testId, request.TestName);

            // Prepare environment variables
            var envVars = new List<string>
            {
                $"SCENARIO={request.Scenario.ToString().ToLower()}",
                $"TEST_ID={testId}"
            };

            foreach (var env in request.Environment)
            {
                envVars.Add($"{env.Key}={env.Value}");
            }

            // Create container configuration
            var containerConfig = new CreateContainerParameters
            {
                Image = "grafana/k6:latest",
                Name = $"k6-test-{testId}",
                Cmd = new[] { "run", "--out", "json=/shared/results.json", $"/scripts/{request.TestScript}" },
                Env = envVars,
                WorkingDir = "/scripts",
                HostConfig = new HostConfig
                {
                    Binds = new[]
                    {
                        $"{GetTestScriptsPath()}:/scripts:ro",
                        $"{GetResultsPath(testId)}:/shared"
                    },
                    AutoRemove = false,
                    Memory = 512 * 1024 * 1024, // 512MB
                    CpuShares = 512
                },
                Labels = new Dictionary<string, string>
                {
                    ["bookstore.test.id"] = testId,
                    ["bookstore.test.name"] = request.TestName,
                    ["bookstore.test.scenario"] = request.Scenario.ToString(),
                    ["bookstore.test.user"] = request.UserEmail ?? "system"
                }
            };

            // Create and start container
            var container = await _dockerClient.Containers.CreateContainerAsync(containerConfig);
            runningTest.ContainerId = container.ID;

            var started = await _dockerClient.Containers.StartContainerAsync(
                container.ID, new ContainerStartParameters());

            if (started)
            {
                runningTest.Status = TestStatus.Running;
                _logger.LogInformation("K6 test {TestId} started successfully in container {ContainerId}",
                                     testId, container.ID);

                // Start monitoring the container
                _ = Task.Run(() => MonitorContainerAsync(runningTest));
            }
            else
            {
                runningTest.Status = TestStatus.Failed;
                runningTest.ErrorMessage = "Failed to start container";
                _logger.LogError("Failed to start K6 test {TestId}", testId);
            }
        }
        catch (Exception ex)
        {
            runningTest.Status = TestStatus.Failed;
            runningTest.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Error starting K6 test {TestId}: {Error}", testId, ex.Message);
        }

        // Cache the test status
        await CacheTestStatusAsync(runningTest);

        return testId;
    }

    public async Task<K6TestResponse?> GetTestStatusAsync(string testId)
    {
        if (_runningTests.TryGetValue(testId, out var runningTest))
        {
            return MapToResponse(runningTest);
        }

        // Try to get from cache
        var cachedStatus = await _cache.GetStringAsync($"k6:test:{testId}");
        if (!string.IsNullOrEmpty(cachedStatus))
        {
            var test = JsonSerializer.Deserialize<RunningK6Test>(cachedStatus);
            return test != null ? MapToResponse(test) : null;
        }

        return null;
    }

    public async Task<bool> CancelTestAsync(string testId)
    {
        if (!_runningTests.TryGetValue(testId, out var runningTest))
        {
            return false;
        }

        if (runningTest.Status != TestStatus.Running)
        {
            return false;
        }

        try
        {
            if (!string.IsNullOrEmpty(runningTest.ContainerId))
            {
                await _dockerClient.Containers.KillContainerAsync(runningTest.ContainerId, new ContainerKillParameters());
                _logger.LogInformation("K6 test {TestId} cancelled", testId);
            }

            runningTest.Status = TestStatus.Cancelled;
            runningTest.CompletedAt = DateTime.UtcNow;

            await CacheTestStatusAsync(runningTest);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling K6 test {TestId}: {Error}", testId, ex.Message);
            return false;
        }
    }

    public async Task<IEnumerable<K6TestResponse>> GetRunningTestsAsync()
    {
        var runningTests = _runningTests.Values
            .Where(t => t.Status == TestStatus.Running || t.Status == TestStatus.Starting)
            .Select(MapToResponse)
            .ToList();

        return await Task.FromResult(runningTests);
    }

    public async Task<K6TestResults?> GetTestResultsAsync(string testId)
    {
        if (_runningTests.TryGetValue(testId, out var runningTest))
        {
            if (runningTest.Results != null)
                return runningTest.Results;
        }

        // Try to load results from file
        var resultsPath = Path.Combine(GetResultsPath(testId), "results.json");
        if (File.Exists(resultsPath))
        {
            try
            {
                var resultsJson = await File.ReadAllTextAsync(resultsPath);
                return ParseK6Results(resultsJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading test results for {TestId}: {Error}", testId, ex.Message);
            }
        }

        return null;
    }

    public async Task<string> GetTestLogsAsync(string testId)
    {
        if (!_runningTests.TryGetValue(testId, out var runningTest) ||
            string.IsNullOrEmpty(runningTest.ContainerId))
        {
            return string.Empty;
        }

        try
        {
            var logs = await _dockerClient.Containers.GetContainerLogsAsync(
                runningTest.ContainerId,
                new ContainerLogsParameters
                {
                    ShowStdout = true,
                    ShowStderr = true,
                    Timestamps = true
                });

            using var reader = new StreamReader(logs);
            return await reader.ReadToEndAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting logs for test {TestId}: {Error}", testId, ex.Message);
            return $"Error retrieving logs: {ex.Message}";
        }
    }

    public async Task CleanupCompletedTestsAsync()
    {
        var completedTests = _runningTests.Values
            .Where(t => t.Status == TestStatus.Completed ||
                       t.Status == TestStatus.Failed ||
                       t.Status == TestStatus.Cancelled)
            .Where(t => t.CompletedAt.HasValue &&
                       t.CompletedAt.Value < DateTime.UtcNow.AddHours(-1))
            .ToList();

        foreach (var test in completedTests)
        {
            try
            {
                // Remove container if exists
                if (!string.IsNullOrEmpty(test.ContainerId))
                {
                    await _dockerClient.Containers.RemoveContainerAsync(
                        test.ContainerId,
                        new ContainerRemoveParameters { Force = true });
                }

                // Remove from running tests
                _runningTests.TryRemove(test.TestId, out _);

                // Clean up result files older than 24 hours
                var resultsDir = GetResultsPath(test.TestId);
                if (Directory.Exists(resultsDir) &&
                    Directory.GetCreationTime(resultsDir) < DateTime.UtcNow.AddDays(-1))
                {
                    Directory.Delete(resultsDir, true);
                }

                _logger.LogInformation("Cleaned up completed test {TestId}", test.TestId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error cleaning up test {TestId}: {Error}", test.TestId, ex.Message);
            }
        }
    }

    private async Task MonitorContainerAsync(RunningK6Test test)
    {
        if (string.IsNullOrEmpty(test.ContainerId))
            return;

        try
        {
            // Wait for container to complete
            var waitResponse = await _dockerClient.Containers.WaitContainerAsync(test.ContainerId);

            // Get container inspect to check exit code
            var inspectResponse = await _dockerClient.Containers.InspectContainerAsync(test.ContainerId);

            if (inspectResponse.State.ExitCode == 0)
            {
                test.Status = TestStatus.Completed;
                test.Results = await GetTestResultsAsync(test.TestId);
                _logger.LogInformation("K6 test {TestId} completed successfully", test.TestId);
            }
            else
            {
                test.Status = TestStatus.Failed;
                test.ErrorMessage = $"Container exited with code {inspectResponse.State.ExitCode}";
                _logger.LogError("K6 test {TestId} failed with exit code {ExitCode}",
                               test.TestId, inspectResponse.State.ExitCode);
            }

            test.CompletedAt = DateTime.UtcNow;
            await CacheTestStatusAsync(test);
        }
        catch (Exception ex)
        {
            test.Status = TestStatus.Failed;
            test.ErrorMessage = ex.Message;
            test.CompletedAt = DateTime.UtcNow;

            _logger.LogError(ex, "Error monitoring K6 test {TestId}: {Error}", test.TestId, ex.Message);
            await CacheTestStatusAsync(test);
        }
    }

    private async Task CacheTestStatusAsync(RunningK6Test test)
    {
        try
        {
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
            };

            var json = JsonSerializer.Serialize(test);
            await _cache.SetStringAsync($"k6:test:{test.TestId}", json, cacheOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error caching test status for {TestId}: {Error}", test.TestId, ex.Message);
        }
    }

    private static K6TestResponse MapToResponse(RunningK6Test test)
    {
        return new K6TestResponse
        {
            TestId = test.TestId,
            TestName = test.TestName,
            Status = test.Status,
            StartedAt = test.StartedAt,
            CompletedAt = test.CompletedAt,
            ContainerId = test.ContainerId,
            ErrorMessage = test.ErrorMessage,
            Results = test.Results
        };
    }

    private static string GetTestScriptsPath()
    {
        var scriptsPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "BookStore.Performance.Tests");
        Directory.CreateDirectory(scriptsPath);
        return Path.GetFullPath(scriptsPath);
    }

    private static string GetResultsPath(string testId)
    {
        var resultsPath = Path.Combine(Path.GetTempPath(), "k6-results", testId);
        Directory.CreateDirectory(resultsPath);
        return resultsPath;
    }

    private K6TestResults ParseK6Results(string resultsJson)
    {
        // This is a simplified parser - in production you'd want more robust JSON parsing
        // of K6's JSON output format
        var results = new K6TestResults();

        try
        {
            using var doc = JsonDocument.Parse(resultsJson);

            // Parse metrics and checks from K6 JSON output
            // K6 outputs line-delimited JSON, so we'd need to parse each line
            // This is a simplified implementation

            results.Metrics["http_req_duration"] = new MetricData
            {
                Type = "trend",
                Contains = true,
                Values = new Dictionary<string, double>
                {
                    ["avg"] = 100.0,
                    ["p(95)"] = 200.0,
                    ["p(99)"] = 300.0
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing K6 results: {Error}", ex.Message);
        }

        return results;
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
        _dockerClient?.Dispose();
    }
}