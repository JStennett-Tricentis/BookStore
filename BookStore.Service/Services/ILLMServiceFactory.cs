namespace BookStore.Service.Services;

/// <summary>
/// Factory for selecting LLM service providers at runtime.
/// </summary>
public interface ILLMServiceFactory
{
    /// <summary>
    /// Get an LLM service by provider name.
    /// </summary>
    /// <param name="provider">Provider name (claude, openai, bedrock, ollama)</param>
    /// <returns>The requested LLM service implementation</returns>
    ILLMService GetService(string provider);

    /// <summary>
    /// Get all available LLM service providers.
    /// </summary>
    IEnumerable<string> GetAvailableProviders();
}

public class LLMServiceFactory : ILLMServiceFactory
{
    private readonly IServiceProvider _serviceProvider;

    public LLMServiceFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public ILLMService GetService(string provider)
    {
        return provider.ToLowerInvariant() switch
        {
            "claude" => _serviceProvider.GetRequiredService<ClaudeService>(),
            "openai" => _serviceProvider.GetRequiredService<OpenAIService>(),
            "bedrock" => _serviceProvider.GetRequiredService<BedrockService>(),
            "ollama" => _serviceProvider.GetRequiredService<OllamaService>(),
            _ => throw new ArgumentException($"Unknown LLM provider: {provider}", nameof(provider))
        };
    }

    public IEnumerable<string> GetAvailableProviders()
    {
        return new[] { "claude", "openai", "bedrock", "ollama" };
    }
}
