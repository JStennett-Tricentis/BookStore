using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Instrumentation.AspNetCore;
using OpenTelemetry.Instrumentation.Http;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Diagnostics;

namespace BookStore.Common.Instrumentation;

public static class OpenTelemetryExtensions
{
    public static IServiceCollection AddBookStoreOpenTelemetry(
        this IServiceCollection services,
        IConfiguration configuration,
        string serviceName)
    {
        var telemetrySettings = new TelemetrySettings();
        configuration.GetSection("Telemetry").Bind(telemetrySettings);

        // Set service name if not provided
        if (string.IsNullOrEmpty(telemetrySettings.ServiceName))
        {
            telemetrySettings.ServiceName = serviceName;
        }

        services.Configure<TelemetrySettings>(configuration.GetSection("Telemetry"));

        // Create resource builder
        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(telemetrySettings.ServiceName, telemetrySettings.ServiceVersion)
            .AddAttributes(new[]
            {
                new KeyValuePair<string, object>("application.name", telemetrySettings.ApplicationName),
                new KeyValuePair<string, object>("application.version", telemetrySettings.ApplicationVersion),
                new KeyValuePair<string, object>("deployment.environment", Environment.GetEnvironmentVariable("ENVIRONMENT") ?? "development")
            });

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.Clear().AddService(telemetrySettings.ServiceName, telemetrySettings.ServiceVersion)
                .AddAttributes(new[]
                {
                    new KeyValuePair<string, object>("application.name", telemetrySettings.ApplicationName),
                    new KeyValuePair<string, object>("application.version", telemetrySettings.ApplicationVersion),
                    new KeyValuePair<string, object>("deployment.environment", Environment.GetEnvironmentVariable("ENVIRONMENT") ?? "development")
                }));

        // Add tracing if enabled
        if (telemetrySettings.Tracing.Enabled)
        {
            services.AddOpenTelemetry()
                .WithTracing(tracing => ConfigureTracing(tracing, telemetrySettings, resourceBuilder));
        }

        // Add metrics if enabled
        if (telemetrySettings.Metrics.Enabled)
        {
            services.AddOpenTelemetry()
                .WithMetrics(metrics => ConfigureMetrics(metrics, telemetrySettings, resourceBuilder));
        }

        // Add logging if enabled
        if (telemetrySettings.Logging.Enabled)
        {
            services.AddLogging(logging => ConfigureLogging(logging, telemetrySettings));
        }

        return services;
    }

    private static TracerProviderBuilder ConfigureTracing(
        TracerProviderBuilder tracing,
        TelemetrySettings settings,
        ResourceBuilder resourceBuilder)
    {
        tracing.SetResourceBuilder(resourceBuilder)
            .SetSampler(new TraceIdRatioBasedSampler(settings.Tracing.SamplingRatio));

        // Add custom sources
        foreach (var source in settings.Tracing.Sources)
        {
            tracing.AddSource(source);
        }

        // Add BookStore activity sources
        tracing.AddSource("BookStore.*");

        // Add ASP.NET Core instrumentation
        tracing.AddAspNetCoreInstrumentation(options =>
        {
            options.RecordException = settings.Tracing.AspNetCore.RecordException;
            options.Filter = httpContext =>
            {
                var path = httpContext.Request.Path.Value ?? string.Empty;
                return !settings.ExcludedPaths.Any(excluded => path.Contains(excluded)) &&
                       !settings.Tracing.AspNetCore.ExcludedRoutes.Any(excluded => path.Contains(excluded));
            };
        });

        // Add HTTP client instrumentation
        tracing.AddHttpClientInstrumentation(options =>
        {
            options.RecordException = settings.Tracing.HttpClient.RecordException;
            options.FilterHttpRequestMessage = request =>
            {
                var uri = request.RequestUri?.ToString() ?? string.Empty;
                return !settings.Tracing.HttpClient.ExcludedHosts.Any(excluded => uri.Contains(excluded));
            };
        });

        // Redis instrumentation not available in current version
        // TODO: Add back when available

        // Add exporters
        ConfigureTracingExporters(tracing, settings);

        return tracing;
    }

    private static MeterProviderBuilder ConfigureMetrics(
        MeterProviderBuilder metrics,
        TelemetrySettings settings,
        ResourceBuilder resourceBuilder)
    {
        metrics.SetResourceBuilder(resourceBuilder);

        // Add custom meters
        foreach (var meter in settings.Metrics.Meters)
        {
            metrics.AddMeter(meter);
        }

        // Add BookStore meters
        metrics.AddMeter("BookStore.*");

        // Add ASP.NET Core metrics
        metrics.AddAspNetCoreInstrumentation();

        // Add HTTP client metrics
        metrics.AddHttpClientInstrumentation();

        // Runtime and process instrumentation not available in current OpenTelemetry version
        // TODO: Add back when available in newer versions

        // Add exporters
        ConfigureMetricsExporters(metrics, settings);

        return metrics;
    }

    private static ILoggingBuilder ConfigureLogging(
        ILoggingBuilder logging,
        TelemetrySettings settings)
    {
        logging.AddOpenTelemetry(options =>
        {
            options.IncludeScopes = settings.Logging.IncludeScopes;
            options.IncludeFormattedMessage = settings.Logging.IncludeFormattedMessage;

            // Add exporters
            ConfigureLoggingExporters(options, settings);
        });

        return logging;
    }

    private static void ConfigureTracingExporters(
        TracerProviderBuilder tracing,
        TelemetrySettings settings)
    {
        // Console exporter
        if (settings.Exporters.Console.Enabled)
        {
            tracing.AddConsoleExporter(options =>
            {
                options.Targets = ConsoleExporterOutputTargets.Debug;
            });
        }

        // OTLP exporter
        if (settings.Exporters.Otlp.Enabled && !string.IsNullOrEmpty(settings.Exporters.Otlp.Endpoint))
        {
            tracing.AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(settings.Exporters.Otlp.Endpoint);
                options.TimeoutMilliseconds = settings.Exporters.Otlp.TimeoutSeconds * 1000;

                if (!string.IsNullOrEmpty(settings.Exporters.Otlp.ApiKey))
                {
                    options.Headers = $"api-key={settings.Exporters.Otlp.ApiKey}";
                }

                foreach (var header in settings.Exporters.Otlp.Headers)
                {
                    if (!string.IsNullOrEmpty(options.Headers))
                        options.Headers += ",";
                    options.Headers += $"{header.Key}={header.Value}";
                }
            });
        }
    }

    private static void ConfigureMetricsExporters(
        MeterProviderBuilder metrics,
        TelemetrySettings settings)
    {
        // Console exporter
        if (settings.Exporters.Console.Enabled)
        {
            metrics.AddConsoleExporter();
        }

        // Prometheus exporter
        if (settings.Exporters.Prometheus.Enabled)
        {
            metrics.AddPrometheusExporter();
        }

        // OTLP exporter
        if (settings.Exporters.Otlp.Enabled && !string.IsNullOrEmpty(settings.Exporters.Otlp.Endpoint))
        {
            metrics.AddOtlpExporter(options =>
            {
                options.Endpoint = new Uri(settings.Exporters.Otlp.Endpoint);
                options.TimeoutMilliseconds = settings.Exporters.Otlp.TimeoutSeconds * 1000;

                if (!string.IsNullOrEmpty(settings.Exporters.Otlp.ApiKey))
                {
                    options.Headers = $"api-key={settings.Exporters.Otlp.ApiKey}";
                }
            });
        }
    }

    private static void ConfigureLoggingExporters(
        OpenTelemetryLoggerOptions options,
        TelemetrySettings settings)
    {
        // Console exporter
        if (settings.Exporters.Console.Enabled)
        {
            options.AddConsoleExporter();
        }

        // OTLP exporter
        if (settings.Exporters.Otlp.Enabled && !string.IsNullOrEmpty(settings.Exporters.Otlp.Endpoint))
        {
            options.AddOtlpExporter(otlpOptions =>
            {
                otlpOptions.Endpoint = new Uri(settings.Exporters.Otlp.Endpoint);
                otlpOptions.TimeoutMilliseconds = settings.Exporters.Otlp.TimeoutSeconds * 1000;

                if (!string.IsNullOrEmpty(settings.Exporters.Otlp.ApiKey))
                {
                    otlpOptions.Headers = $"api-key={settings.Exporters.Otlp.ApiKey}";
                }
            });
        }
    }

    public static ActivitySource CreateActivitySource(string name, string? version = null)
    {
        return new ActivitySource(name, version ?? "1.0.0");
    }
}