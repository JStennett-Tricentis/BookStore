using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddLogging();

var app = builder.Build();

var logger = app.Services.GetRequiredService<ILogger<Program>>();

logger.LogInformation("🚀 Starting BookStore Services (Simplified Aspire Alternative)");
logger.LogInformation("======================================================");

// Start infrastructure with Docker Compose
logger.LogInformation("📦 Starting infrastructure (MongoDB, Redis)...");
var dockerProcess = Process.Start(new ProcessStartInfo
{
    FileName = "docker-compose",
    Arguments = "-f ../docker-compose.perf.yml up -d mongodb redis",
    UseShellExecute = false,
    RedirectStandardOutput = true,
    RedirectStandardError = true
});

if (dockerProcess != null)
{
    await dockerProcess.WaitForExitAsync();
    if (dockerProcess.ExitCode == 0)
    {
        logger.LogInformation("✅ Infrastructure started successfully");
    }
    else
    {
        logger.LogError("❌ Failed to start infrastructure");
        return;
    }
}

// Wait for infrastructure
await Task.Delay(5000);

// Start BookStore Service (using compiled DLL to avoid workload issues)
logger.LogInformation("🔧 Starting BookStore API Service...");
var bookStoreProcess = Process.Start(new ProcessStartInfo
{
    FileName = "dotnet",
    Arguments = "../BookStore.Service/bin/Debug/net9.0/BookStore.Service.dll --urls http://localhost:7002",
    UseShellExecute = false,
    RedirectStandardOutput = true,
    RedirectStandardError = true
});

// Start Performance Service (using compiled DLL to avoid workload issues)
logger.LogInformation("🎯 Starting Performance Service...");
var performanceProcess = Process.Start(new ProcessStartInfo
{
    FileName = "dotnet",
    Arguments = "../BookStore.Performance.Service/bin/Debug/net9.0/BookStore.Performance.Service.dll --urls http://localhost:7004",
    UseShellExecute = false,
    RedirectStandardOutput = true,
    RedirectStandardError = true
});

logger.LogInformation("");
logger.LogInformation("🎉 All services are starting!");
logger.LogInformation("============================");
logger.LogInformation("📊 BookStore API:      http://localhost:7002");
logger.LogInformation("🔗 Swagger UI:         http://localhost:7002/swagger");
logger.LogInformation("⚡ Performance Service: http://localhost:7004");
logger.LogInformation("💾 MongoDB:            localhost:27017");
logger.LogInformation("🗄️  Redis:              localhost:6379");
logger.LogInformation("");
logger.LogInformation("✨ Press Ctrl+C to stop all services");

// Wait for cancellation
var cts = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) =>
{
    e.Cancel = true;
    cts.Cancel();
};

try
{
    await Task.Delay(-1, cts.Token);
}
catch (TaskCanceledException)
{
    logger.LogInformation("🛑 Shutting down services...");

    bookStoreProcess?.Kill();
    performanceProcess?.Kill();

    var stopDockerProcess = Process.Start(new ProcessStartInfo
    {
        FileName = "docker-compose",
        Arguments = "-f ../docker-compose.perf.yml down",
        UseShellExecute = false
    });

    if (stopDockerProcess != null)
    {
        await stopDockerProcess.WaitForExitAsync();
    }

    logger.LogInformation("✅ All services stopped");
}