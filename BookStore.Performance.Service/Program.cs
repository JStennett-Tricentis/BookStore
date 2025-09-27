using BookStore.Common.Configuration;
using BookStore.Performance.Service.Services;
using Microsoft.AspNetCore.Mvc;
using OpenTelemetry;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Services.Configure<RedisSettings>(
    builder.Configuration.GetSection("Redis"));

// Redis for caching test status
var redisSettings = builder.Configuration.GetSection("Redis").Get<RedisSettings>()!;
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisSettings.ConnectionString;
    options.InstanceName = redisSettings.InstanceName;
});

// Core services
builder.Services.AddScoped<IK6OrchestrationService, K6OrchestrationService>();

// Simplified API setup - remove versioning for now

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Health Checks - simplified
builder.Services.AddHealthChecks();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders(builder.Configuration.GetSection("Cors:ExposeHeaders").Get<string[]>() ?? []);
    });
});

// SignalR for real-time updates
builder.Services.AddSignalR();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "BookStore Performance Service API",
        Version = "v1",
        Description = "K6 Performance Test Orchestration Service"
    });
});

// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracingBuilder =>
    {
        tracingBuilder
            .SetResourceBuilder(ResourceBuilder.CreateDefault()
                .AddService("BookStore.Performance.Service", "1.0.0"))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
;
    });

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BookStore Performance Service v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHealthChecks("/health");

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Performance test status hub for real-time updates
app.MapHub<PerformanceHub>("/performance-hub");

// Seed endpoint for quick testing
app.MapPost("/quick-setup", async (IK6OrchestrationService k6Service) =>
{
    var smokeTest = new BookStore.Performance.Service.Models.K6TestRequest
    {
        TestName = "Quick Smoke Test",
        Scenario = BookStore.Performance.Service.Models.TestScenarioType.Smoke,
        TestScript = "tests/books.js",
        Environment = new Dictionary<string, string>
        {
            ["ENVIRONMENT"] = "local",
            ["SCENARIO"] = "smoke"
        }
    };

    var testId = await k6Service.StartTestAsync(smokeTest);
    return Results.Ok(new { message = "Quick smoke test started", testId });
});

app.Run();