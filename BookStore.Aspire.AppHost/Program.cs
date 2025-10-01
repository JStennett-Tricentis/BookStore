var builder = DistributedApplication.CreateBuilder(args);

// MongoDB
var mongodb = builder.AddMongoDB("mongodb")
    .WithDataVolume()
    .WithEnvironment("MONGO_INITDB_ROOT_USERNAME", "")
    .WithEnvironment("MONGO_INITDB_ROOT_PASSWORD", "")
    .WithArgs("--noauth")
    .AddDatabase("bookstore");

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
    .WithHttpEndpoint(port: 3000, targetPort: 3000, name: "http")
    .WithEnvironment("GF_SECURITY_ADMIN_PASSWORD", "admin123")
    .WithEnvironment("GF_USERS_ALLOW_SIGN_UP", "false")
    .WithEnvironment("GF_SERVER_ROOT_URL", "http://localhost:3000");

// BookStore Service
var bookstoreService = builder.AddProject<Projects.BookStore_Service>("bookstore-service")
    .WithReference(mongodb)
    .WithReference(redis)
    .WithHttpEndpoint(port: 7002, name: "http")
    .WithEnvironment("ConnectionStrings__mongodb", mongodb)
    .WithEnvironment("ConnectionStrings__redis", redis);

// Performance Service
var performanceService = builder.AddProject<Projects.BookStore_Performance_Service>("bookstore-performance")
    .WithReference(redis)
    .WithHttpEndpoint(port: 7004, name: "http");

builder.Build().Run();