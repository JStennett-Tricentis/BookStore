namespace BookStore.Service.Services;

/// <summary>
/// Interface for LLM services that generate book summaries.
/// Implemented by Claude, OpenAI, AWS Bedrock, Ollama, and LM Studio providers.
/// </summary>
public interface ILLMService
{
    /// <summary>
    /// Generate an AI-powered book summary.
    /// </summary>
    Task<string> GenerateBookSummaryAsync(string title, string author, string? description, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the provider name (e.g., "claude", "openai", "bedrock", "ollama", "lmstudio")
    /// </summary>
    string ProviderName { get; }
}
