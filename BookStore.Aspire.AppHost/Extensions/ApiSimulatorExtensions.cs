using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

namespace BookStore.Aspire.AppHost.Extensions;

/// <summary>
/// Extension methods for integrating the Tricentis API Simulator into the Aspire AppHost.
/// Enables zero-cost LLM performance testing by mocking external API providers.
/// </summary>
public static class ApiSimulatorExtensions
{
    /// <summary>
    /// Adds the API Simulator container to the distributed application if enabled in configuration.
    /// </summary>
    /// <param name="builder">The distributed application builder.</param>
    /// <param name="name">The resource name (default: "api-simulator").</param>
    /// <returns>The API Simulator container resource, or null if disabled.</returns>
    public static IResourceBuilder<ContainerResource>? AddApiSimulatorIfEnabled(
        this IDistributedApplicationBuilder builder,
        string name = "api-simulator")
    {
        // Check if simulator is enabled in configuration
        var isEnabled = builder.Configuration.GetValue<bool>(ServiceConstants.ApiSimulator.ConfigKey);

        if (!isEnabled)
        {
            Console.WriteLine("ℹ️  API Simulator: Disabled - using real LLM APIs");
            return null;
        }

        Console.WriteLine("🎭 API Simulator: Enabled - zero-cost LLM testing mode");

        // Path to simulation configuration
        var simulatorConfigPath = Path.GetFullPath(
            Path.Combine(builder.AppHostDirectory, "appsettings.simulator.yml"));

        if (!File.Exists(simulatorConfigPath))
        {
            throw new FileNotFoundException(
                $"API Simulator configuration not found: {simulatorConfigPath}");
        }

        // Add the simulator container with three HTTP endpoints
        var simulator = builder.AddContainer(
                name,
                ServiceConstants.ApiSimulator.DockerImage,
                ServiceConstants.ApiSimulator.DockerTag)
            .WithBindMount(simulatorConfigPath, "/usr/share/appsettings.yml", isReadOnly: true)
            .WithHttpEndpoint(
                port: ServiceConstants.ApiSimulator.InternalPort,
                targetPort: 17070,
                name: "internal")
            .WithHttpEndpoint(
                port: ServiceConstants.ApiSimulator.UiPort,
                targetPort: 28880,
                name: "ui")
            .WithHttpEndpoint(
                port: ServiceConstants.ApiSimulator.ServicePort,
                targetPort: 5020,
                name: "service")
            .WithEnvironment("ASPNETCORE_URLS", "http://+:17070")
            .WithEnvironment("Logging__LogLevel__Default", "Information")
            .WithEnvironment("Logging__LogLevel__Microsoft", "Warning");

        Console.WriteLine($"   Internal API: http://localhost:{ServiceConstants.ApiSimulator.InternalPort}");
        Console.WriteLine($"   UI Dashboard: http://localhost:{ServiceConstants.ApiSimulator.UiPort}");
        Console.WriteLine($"   Service API:  http://localhost:{ServiceConstants.ApiSimulator.ServicePort}");

        return simulator;
    }

    /// <summary>
    /// Configures a service to use the API Simulator for LLM provider calls.
    /// Injects environment variables to override provider base URLs.
    /// </summary>
    /// <typeparam name="T">The project resource type.</typeparam>
    /// <param name="builder">The project resource builder.</param>
    /// <param name="simulator">The API Simulator container resource (or null if disabled).</param>
    /// <returns>The project resource builder with simulator configuration.</returns>
    public static IResourceBuilder<T> WithApiSimulator<T>(
        this IResourceBuilder<T> builder,
        IResourceBuilder<ContainerResource>? simulator)
        where T : IResourceWithEnvironment
    {
        // If simulator is not enabled, return unchanged
        if (simulator == null)
        {
            return builder;
        }

        var simulatorBaseUrl = ServiceConstants.ApiSimulator.ServiceBaseUrl;

        // Wait for simulator to be ready before starting this service
        builder.WaitFor(simulator);

        // Override LLM provider base URLs to point to simulator
        builder
            .WithEnvironment("LLM__Providers__Claude__BaseUrl", simulatorBaseUrl)
            .WithEnvironment("LLM__Providers__OpenAI__BaseUrl", simulatorBaseUrl)
            .WithEnvironment("LLM__Providers__Bedrock__BaseUrl", simulatorBaseUrl)
            .WithEnvironment("USE_API_SIMULATOR", "true");

        Console.WriteLine($"   ✓ {builder.Resource.Name}: Configured to use API Simulator");

        return builder;
    }

    /// <summary>
    /// Gets the simulator service endpoint URL for external use.
    /// </summary>
    /// <param name="simulator">The API Simulator container resource.</param>
    /// <returns>The base URL for the simulator service API.</returns>
    public static string GetServiceUrl(this IResourceBuilder<ContainerResource> simulator)
    {
        return ServiceConstants.ApiSimulator.ServiceBaseUrl;
    }
}
