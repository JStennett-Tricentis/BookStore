using Microsoft.Extensions.Configuration;

namespace BookStore.Aspire.AppHost.Extensions;

public static class ApiSimulatorExtensions
{
    public static IResourceBuilder<ContainerResource>? AddApiSimulatorIfEnabled(this IDistributedApplicationBuilder builder)
    {
        var enabled = builder.Configuration.GetValue<bool>("ApiSimulatorEnabled", false);
        if (!enabled)
        {
            return null;
        }

        // API Simulator - single port serving both UI and API endpoints:
        // - UI Dashboard: http://localhost:28880/ui/
        // - API endpoints: http://localhost:28880/api/
        var simulationsPath = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, "../simulations"));
        var simulator = builder.AddContainer("api-simulator", "ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci", "0.2")
            .WithHttpEndpoint(port: 28880, targetPort: 28880, name: "http", isProxied: false)
            // Platform specification for ARM64/Apple Silicon compatibility (runs amd64 via emulation)
            .WithContainerRuntimeArgs("--platform", "linux/amd64")
            // Mount settings to override default config at /app/appsettings.yml
            .WithBindMount("./appsettings.simulator.yml", "/app/appsettings.yml", isReadOnly: false)
            // Mount simulations directory (read-only - simulator reads from here)
            .WithBindMount(simulationsPath, "/workspace", isReadOnly: false)
            .WithEnvironment("API_SIMULATOR_LOG_LEVEL", "Information");

        // Note: WithUrls() is available in Aspire 9.4+ for custom endpoint display text
        // Currently using Aspire 9.0.0 - endpoints will display with default names

        return simulator;
    }

    public static IResourceBuilder<ProjectResource> WithApiSimulator(
        this IResourceBuilder<ProjectResource> builder,
        IResourceBuilder<ContainerResource>? simulator)
    {
        if (simulator == null)
        {
            return builder;
        }

        return builder
            .WithReference(simulator.GetEndpoint("http"))
            .WithEnvironment("ApiSimulator__Enabled", "true")
            .WithEnvironment("ApiSimulator__BaseUrl", simulator.GetEndpoint("http"));
    }
}
