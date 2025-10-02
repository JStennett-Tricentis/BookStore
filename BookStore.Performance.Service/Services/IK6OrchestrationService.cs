using BookStore.Performance.Service.Models;

namespace BookStore.Performance.Service.Services;

public interface IK6OrchestrationService
{
    Task<string> StartTestAsync(K6TestRequest request);
    Task<K6TestResponse?> GetTestStatusAsync(string testId);
    Task<bool> CancelTestAsync(string testId);
    Task<IEnumerable<K6TestResponse>> GetRunningTestsAsync();
    Task<K6TestResults?> GetTestResultsAsync(string testId);
    Task<string> GetTestLogsAsync(string testId);
    Task CleanupCompletedTestsAsync();
}
