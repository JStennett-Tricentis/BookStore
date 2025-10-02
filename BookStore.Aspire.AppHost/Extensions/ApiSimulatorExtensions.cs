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

        // API Simulator with three endpoints:
        // - internal-api (17070): Internal API endpoint for service-to-service communication
        // - ui (28880): Web UI dashboard for simulator management
        // - service (5020): Service endpoint for external access
        var simulator = builder.AddContainer("api-simulator", "ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci", "0.2")
            .WithHttpEndpoint(port: 17070, targetPort: 17070, name: "internal-api")
            .WithHttpEndpoint(port: 28880, targetPort: 28880, name: "ui")
            .WithHttpEndpoint(port: 5020, targetPort: 5020, name: "service");

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
            .WithReference(simulator.GetEndpoint("internal-api"))
            .WithEnvironment("ApiSimulator__Enabled", "true")
            .WithEnvironment("ApiSimulator__BaseUrl", simulator.GetEndpoint("internal-api"));
    }
}
