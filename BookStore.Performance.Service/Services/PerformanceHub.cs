using Microsoft.AspNetCore.SignalR;
using BookStore.Performance.Service.Models;

namespace BookStore.Performance.Service.Services;

public class PerformanceHub : Hub
{
    private readonly ILogger<PerformanceHub> _logger;

    public PerformanceHub(ILogger<PerformanceHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinTestGroup(string testId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"test-{testId}");
        _logger.LogDebug("Client {ConnectionId} joined test group {TestId}", Context.ConnectionId, testId);
    }

    public async Task LeaveTestGroup(string testId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"test-{testId}");
        _logger.LogDebug("Client {ConnectionId} left test group {TestId}", Context.ConnectionId, testId);
    }

    public async Task JoinAllTestsGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "all-tests");
        _logger.LogDebug("Client {ConnectionId} joined all tests group", Context.ConnectionId);
    }

    public async Task LeaveAllTestsGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "all-tests");
        _logger.LogDebug("Client {ConnectionId} left all tests group", Context.ConnectionId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogDebug("Client {ConnectionId} disconnected", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

// Extension methods to make it easier to send updates
public static class PerformanceHubExtensions
{
    public static async Task SendTestStatusUpdate(this IHubContext<PerformanceHub> hubContext,
        string testId, K6TestStatus status)
    {
        await hubContext.Clients.Group($"test-{testId}").SendAsync("TestStatusUpdate", status);
        await hubContext.Clients.Group("all-tests").SendAsync("TestStatusUpdate", status);
    }

    public static async Task SendTestStarted(this IHubContext<PerformanceHub> hubContext,
        K6TestResponse testResponse)
    {
        await hubContext.Clients.Group($"test-{testResponse.TestId}").SendAsync("TestStarted", testResponse);
        await hubContext.Clients.Group("all-tests").SendAsync("TestStarted", testResponse);
    }

    public static async Task SendTestCompleted(this IHubContext<PerformanceHub> hubContext,
        K6TestResponse testResponse)
    {
        await hubContext.Clients.Group($"test-{testResponse.TestId}").SendAsync("TestCompleted", testResponse);
        await hubContext.Clients.Group("all-tests").SendAsync("TestCompleted", testResponse);
    }

    public static async Task SendTestFailed(this IHubContext<PerformanceHub> hubContext,
        string testId, string errorMessage)
    {
        await hubContext.Clients.Group($"test-{testId}").SendAsync("TestFailed", new { testId, errorMessage });
        await hubContext.Clients.Group("all-tests").SendAsync("TestFailed", new { testId, errorMessage });
    }
}