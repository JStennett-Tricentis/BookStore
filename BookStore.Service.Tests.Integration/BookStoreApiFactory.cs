using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Testcontainers.MongoDb;
using Testcontainers.Redis;

namespace BookStore.Service.Tests.Integration;

public class BookStoreApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MongoDbContainer _mongoDbContainer;
    private readonly RedisContainer _redisContainer;

    public BookStoreApiFactory()
    {
        _mongoDbContainer = new MongoDbBuilder()
            .WithImage("mongo:7.0")
            .WithPortBinding(27017, true)
            .Build();

        _redisContainer = new RedisBuilder()
            .WithImage("redis:7.2")
            .WithPortBinding(6379, true)
            .Build();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Override MongoDB connection string
            services.AddSingleton<IHostedService>(provider =>
            {
                var mongoConnectionString = _mongoDbContainer.GetConnectionString();
                var redisConnectionString = _redisContainer.GetConnectionString();

                Environment.SetEnvironmentVariable("ConnectionStrings__mongodb", mongoConnectionString);
                Environment.SetEnvironmentVariable("ConnectionStrings__redis", redisConnectionString);

                return new EmptyHostedService();
            });
        });

        builder.UseEnvironment("Testing");
    }

    public async Task InitializeAsync()
    {
        await _mongoDbContainer.StartAsync();
        await _redisContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _mongoDbContainer.DisposeAsync();
        await _redisContainer.DisposeAsync();
        await base.DisposeAsync();
    }

    // Empty hosted service for DI registration
    private class EmptyHostedService : IHostedService
    {
        public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;
        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}