using OpenTelemetry.Exporter;

namespace BookStore.Common.Instrumentation;

public class TelemetrySettings
{
    public string ApplicationName { get; set; } = "bookstore";
    public string ApplicationVersion { get; set; } = "1.0.0";
    public string ServiceName { get; set; } = string.Empty;
    public string ServiceVersion { get; set; } = "1.0.0";
    public List<string> ExcludedPaths { get; set; } = new();

    // Tracing
    public TracingSettings Tracing { get; set; } = new();

    // Metrics
    public MetricsSettings Metrics { get; set; } = new();

    // Logging
    public LoggingSettings Logging { get; set; } = new();

    // Exporters
    public ExporterSettings Exporters { get; set; } = new();

    // Traceloop
    public TraceLoopSettings TraceLoop { get; set; } = new();
}

public class TracingSettings
{
    public bool Enabled { get; set; } = true;
    public double SamplingRatio { get; set; } = 1.0;
    public List<string> Sources { get; set; } = new();
    public AspNetCoreInstrumentationSettings AspNetCore { get; set; } = new();
    public HttpClientInstrumentationSettings HttpClient { get; set; } = new();
    public bool EnableSqlInstrumentation { get; set; } = true;
    public bool EnableRedisInstrumentation { get; set; } = true;
}

public class MetricsSettings
{
    public bool Enabled { get; set; } = true;
    public List<string> Meters { get; set; } = new();
    public bool EnableRuntimeInstrumentation { get; set; } = true;
    public bool EnableProcessInstrumentation { get; set; } = true;
}

public class LoggingSettings
{
    public bool Enabled { get; set; } = true;
    public List<string> Categories { get; set; } = new();
    public bool IncludeScopes { get; set; } = true;
    public bool IncludeFormattedMessage { get; set; } = true;
}

public class AspNetCoreInstrumentationSettings
{
    public bool RecordException { get; set; } = true;
    public bool EnableGrpcAspNetCoreSupport { get; set; } = false;
    public List<string> ExcludedRoutes { get; set; } = new();
}

public class HttpClientInstrumentationSettings
{
    public bool RecordException { get; set; } = true;
    public List<string> ExcludedHosts { get; set; } = new();
}

public class ExporterSettings
{
    public OtlpExporterSettings Otlp { get; set; } = new();
    public ConsoleExporterSettings Console { get; set; } = new();
    public PrometheusExporterSettings Prometheus { get; set; } = new();
}

public class OtlpExporterSettings
{
    public bool Enabled { get; set; } = false;
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new();
    public int TimeoutSeconds { get; set; } = 30;
    public OtlpExportProtocol Protocol { get; set; } = OtlpExportProtocol.Grpc;
}

public class TraceLoopSettings
{
    public bool Enabled { get; set; } = false;
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}

public class ConsoleExporterSettings
{
    public bool Enabled { get; set; } = false;
    public ConsoleExporterOutputTargets Targets { get; set; } = ConsoleExporterOutputTargets.Console;
}


public class PrometheusExporterSettings
{
    public bool Enabled { get; set; } = false;
    public string HttpListenerPrefixes { get; set; } = "http://localhost:9090/";
    public bool ScrapeResponseCacheDurationMilliseconds { get; set; } = true;
}