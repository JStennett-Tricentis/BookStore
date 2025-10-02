namespace BookStore.Aspire.AppHost;

/// <summary>
/// Service configuration constants for the BookStore Aspire AppHost.
/// </summary>
public static class ServiceConstants
{
    /// <summary>
    /// API Simulator configuration.
    /// </summary>
    public static class ApiSimulator
    {
        /// <summary>
        /// Docker image for the Tricentis API Simulator.
        /// </summary>
        public const string DockerImage = "ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci";

        /// <summary>
        /// Docker image tag/version.
        /// </summary>
        public const string DockerTag = "0.2";

        /// <summary>
        /// Internal API port (health checks, management).
        /// </summary>
        public const int InternalPort = 17070;

        /// <summary>
        /// UI Dashboard port (web interface).
        /// </summary>
        public const int UiPort = 28880;

        /// <summary>
        /// Service API port (simulated endpoints).
        /// </summary>
        public const int ServicePort = 5020;

        /// <summary>
        /// Base URL for the simulator service API.
        /// </summary>
        public const string ServiceBaseUrl = "http://localhost:5020";

        /// <summary>
        /// Configuration section key in appsettings.
        /// </summary>
        public const string ConfigKey = "ApiSimulatorEnabled";
    }

    /// <summary>
    /// LLM Provider configuration keys.
    /// </summary>
    public static class LlmProviders
    {
        public const string Claude = "Claude";
        public const string OpenAI = "OpenAI";
        public const string Bedrock = "Bedrock";
        public const string Ollama = "Ollama";
    }
}
