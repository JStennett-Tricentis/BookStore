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

        var simulator = builder.AddContainer("api-simulator", "ghcr.io/tricentis-product-integration/tpi-iris-simulator-ci", "0.2")
            .WithHttpEndpoint(port: 17070, targetPort: 17070, name: "api")
            .WithHttpEndpoint(port: 28880, targetPort: 28880, name: "ui")
            .WithHttpEndpoint(port: 5020, targetPort: 5020, name: "service");

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
            .WithReference(simulator.GetEndpoint("api"))
            .WithEnvironment("ApiSimulator__Enabled", "true")
            .WithEnvironment("ApiSimulator__BaseUrl", simulator.GetEndpoint("api"));
    }
}
