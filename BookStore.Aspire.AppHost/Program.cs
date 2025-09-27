var builder = DistributedApplication.CreateBuilder(args);

// MongoDB - simplified setup
var mongodb = builder.AddMongoDB("mongodb")
    .WithDataVolume()
    .AddDatabase("bookstore");

// Redis - simplified setup
var redis = builder.AddRedis("redis")
    .WithDataVolume();

// BookStore Service - using path-based reference
var bookStoreService = builder.AddProject("bookstore-service", "../BookStore.Service/BookStore.Service.csproj")
    .WithReference(mongodb)
    .WithReference(redis);

// Performance Service - using path-based reference
var performanceService = builder.AddProject("bookstore-performance", "../BookStore.Performance.Service/BookStore.Performance.Service.csproj")
    .WithReference(redis);

builder.Build().Run();