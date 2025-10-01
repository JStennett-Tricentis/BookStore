using System.Diagnostics;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using BookStore.Common.Instrumentation;

namespace BookStore.Service.Services;

public interface IClaudeService
{
    Task<string> GenerateBookSummaryAsync(string title, string author, string? description, CancellationToken cancellationToken = default);
}

public class ClaudeService : IClaudeService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<ClaudeService> _logger;
    private readonly ActivitySource _activitySource;

    public ClaudeService(IConfiguration configuration, ILogger<ClaudeService> logger, ActivitySource activitySource)
    {
        var apiKey = configuration["Claude:ApiKey"] ?? throw new InvalidOperationException("Claude API key not configured");
        _client = new AnthropicClient(new APIAuthentication(apiKey));
        _logger = logger;
        _activitySource = activitySource;
    }

    public async Task<string> GenerateBookSummaryAsync(string title, string author, string? description, CancellationToken cancellationToken = default)
    {
        using var activity = _activitySource.StartActivity("claude.generate_summary", ActivityKind.Client);

        var prompt = BuildPrompt(title, author, description);

        // Add LLM-specific trace tags using OpenTelemetry semantic conventions
        activity?.SetTag(TraceTags.LlmRequestTypeKey, TraceTags.ChatRequestType);
        activity?.SetTag(TraceTags.LlmOperationNameKey, TraceTags.ChatOperation);
        activity?.SetTag(TraceTags.GenAiOperationNameKey, TraceTags.ChatOperation);
        activity?.SetTag(TraceTags.LLMSystem, "anthropic");
        activity?.SetTag(TraceTags.LlmModelNameKey, "claude-3-5-sonnet-20241022");
        activity?.SetTag(TraceTags.GenAiRequestMaxTokensKey, 500);
        activity?.SetTag(TraceTags.LlmPrompt0ContentKey, prompt);
        activity?.SetTag(TraceTags.LlmPrompt0RoleKey, "user");

        var startTime = DateTimeOffset.UtcNow;

        try
        {
            var messages = new List<Message>
            {
                new Message(RoleType.User, prompt)
            };

            var parameters = new MessageParameters
            {
                Messages = messages,
                MaxTokens = 500,
                Model = "claude-3-5-sonnet-20241022",
                Stream = false,
                Temperature = 0.7m
            };

            var response = await _client.Messages.GetClaudeMessageAsync(parameters, cancellationToken);

            var latency = (DateTimeOffset.UtcNow - startTime).TotalMilliseconds;
            var textContent = response.Content.FirstOrDefault() as TextContent;
            var summary = textContent?.Text ?? "Unable to generate summary";

            // Add response trace tags
            activity?.SetTag(TraceTags.GenAiResponseModelKey, response.Model);
            activity?.SetTag(TraceTags.GenAiResponseIdKey, response.Id);
            activity?.SetTag(TraceTags.GenAiUsageInputTokensKey, response.Usage.InputTokens);
            activity?.SetTag(TraceTags.GenAiUsageOutputTokensKey, response.Usage.OutputTokens);
            activity?.SetTag(TraceTags.GenAiUsageTotalTokensKey, response.Usage.InputTokens + response.Usage.OutputTokens);
            activity?.SetTag(TraceTags.LlmLatencyKey, latency);
            activity?.SetTag(TraceTags.LlmCompletion0ContentKey, summary);
            activity?.SetTag(TraceTags.LlmCompletion0RoleKey, "assistant");
            activity?.SetTag(TraceTags.LlmCompletion0FinishReasonKey, response.StopReason?.ToString() ?? "end_turn");
            activity?.SetTag(TraceTags.TraceLoopOutputKey, summary);
            activity?.SetStatus(ActivityStatusCode.Ok);

            _logger.LogInformation(
                "Generated book summary using Claude. Model: {Model}, Input tokens: {InputTokens}, Output tokens: {OutputTokens}, Latency: {Latency}ms",
                response.Model, response.Usage.InputTokens, response.Usage.OutputTokens, latency);

            return summary;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.AddTag("exception.type", ex.GetType().FullName);
            activity?.AddTag("exception.message", ex.Message);
            activity?.AddTag("exception.stacktrace", ex.StackTrace ?? "");
            _logger.LogError(ex, "Failed to generate book summary using Claude");
            throw;
        }
    }

    private static string BuildPrompt(string title, string author, string? description)
    {
        var prompt = $"Generate a concise, engaging 2-3 sentence summary for a book titled \"{title}\" by {author}.";

        if (!string.IsNullOrEmpty(description))
        {
            prompt += $" Here's some context about the book: {description}";
        }

        prompt += " Focus on what makes this book interesting and worth reading.";

        return prompt;
    }
}
