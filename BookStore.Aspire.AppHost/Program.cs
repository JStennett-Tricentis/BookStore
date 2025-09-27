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

// BookStore Service
builder.AddProject<Projects.BookStore_Service>("bookstore-service")
    .WithReference(mongodb)
    .WithReference(redis)
    .WithHttpEndpoint(port: 7002, name: "http")
    .WithEnvironment("ConnectionStrings__mongodb", mongodb)
    .WithEnvironment("ConnectionStrings__redis", redis);

// Performance Service
builder.AddProject<Projects.BookStore_Performance_Service>("bookstore-performance")
    .WithReference(redis)
    .WithHttpEndpoint(port: 7004, name: "http");

builder.Build().Run();