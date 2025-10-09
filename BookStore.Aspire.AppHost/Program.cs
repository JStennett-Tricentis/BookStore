using BookStore.Aspire.AppHost.Extensions;

var builder = DistributedApplication.CreateBuilder(args);

// API Simulator (optional - enables zero-cost LLM testing)
var apiSimulator = builder.AddApiSimulatorIfEnabled();

// MongoDB - Aspire manages credentials automatically via data volumes
var mongodb = builder.AddMongoDB("mongodb")
    .WithDataVolume();

var bookstoreDb = mongodb.AddDatabase("bookstore", "bookstore");

// Redis
var redis = builder.AddRedis("redis")
    .WithDataVolume();

// Prometheus
var prometheusConfigPath = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, "../monitoring/prometheus"));
var prometheus = builder.AddContainer("prometheus", "prom/prometheus", "v2.48.0")
    .WithBindMount(prometheusConfigPath, "/etc/prometheus", isReadOnly: true)
    .WithHttpEndpoint(port: 9090, targetPort: 9090, name: "http")
    .WithArgs("--config.file=/etc/prometheus/prometheus.yml",
              "--storage.tsdb.path=/prometheus",
              "--web.console.libraries=/usr/share/prometheus/console_libraries",
              "--web.console.templates=/usr/share/prometheus/consoles",
              "--web.enable-lifecycle");

// Grafana
var grafanaDatasourcesPath = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, "../monitoring/grafana/datasources"));
var grafanaDashboardsPath = Path.GetFullPath(Path.Combine(builder.AppHostDirectory, "../monitoring/grafana/dashboards"));
var grafana = builder.AddContainer("grafana", "grafana/grafana", "10.2.0")
    .WithBindMount(grafanaDatasourcesPath, "/etc/grafana/provisioning/datasources", isReadOnly: true)
    .WithBindMount(grafanaDashboardsPath, "/etc/grafana/provisioning/dashboards", isReadOnly: true)
    .WithHttpEndpoint(port: 3333, targetPort: 3000, name: "http")
    .WithEnvironment("GF_SECURITY_ADMIN_PASSWORD", "admin123")
    .WithEnvironment("GF_USERS_ALLOW_SIGN_UP", "false")
    .WithEnvironment("GF_SERVER_ROOT_URL", "http://localhost:3333");

// BookStore Service
var bookstoreService = builder.AddProject<Projects.BookStore_Service>("bookstore-service")
    .WithReference(bookstoreDb)
    .WithReference(redis)
    .WithApiSimulator(apiSimulator)
    .WithHttpEndpoint(port: 7002, name: "http")
    .WithExternalHttpEndpoints();

// Performance Service
var performanceService = builder.AddProject<Projects.BookStore_Performance_Service>("bookstore-performance")
    .WithReference(redis)
    .WithHttpEndpoint(port: 7004, name: "http")
    .WithExternalHttpEndpoints();

builder.Build().Run();
