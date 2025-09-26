var builder = DistributedApplication.CreateBuilder(args);

// MongoDB
var mongodb = builder.AddMongoDB("mongodb")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithDataVolume()
    .AddDatabase("bookstore");

// Redis
var redis = builder.AddRedis("redis")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithDataVolume();

// BookStore Service
var bookStoreService = builder.AddProject<Projects.BookStore_Service>("bookstore-service")
    .WithReference(mongodb)
    .WithReference(redis)
    .WithEnvironment("Database__ConnectionString", mongodb.GetConnectionString())
    .WithEnvironment("Redis__ConnectionString", redis.GetConnectionString());

// Management Service (placeholder for future implementation)
// var managementService = builder.AddProject<Projects.BookStore_Management_Service>("bookstore-management")
//     .WithReference(mongodb)
//     .WithReference(redis);

builder.Build().Run();