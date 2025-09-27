using BookStore.Common.Configuration;
using BookStore.Common.Instrumentation;
using BookStore.Service.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Services.Configure<DatabaseSettings>(
    builder.Configuration.GetSection("Database"));
builder.Services.Configure<RedisSettings>(
    builder.Configuration.GetSection("Redis"));

// MongoDB
var databaseSettings = builder.Configuration.GetSection("Database").Get<DatabaseSettings>()!;
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    return new MongoClient(databaseSettings.ConnectionString);
});
builder.Services.AddScoped(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(databaseSettings.DatabaseName);
});

// Redis
var redisSettings = builder.Configuration.GetSection("Redis").Get<RedisSettings>()!;
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisSettings.ConnectionString;
    options.InstanceName = redisSettings.InstanceName;
});

// Services
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IAuthorService, AuthorService>();

// Simplified API setup - remove versioning for now

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
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

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "BookStore API", Version = "v1" });
});

// OpenTelemetry
builder.Services.AddBookStoreOpenTelemetry(builder.Configuration, "BookStore.Service");

var app = builder.Build();

// Configure pipeline
// Enable Swagger in all environments for testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BookStore API V1");
    c.RoutePrefix = "swagger";
});

// Add a redirect from /swagger to /swagger/index.html for convenience
app.MapGet("/swagger", () => Results.Redirect("/swagger/index.html"));

app.UseHealthChecks("/health");

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed data endpoint for testing
app.MapPost("/seed-data", async (IBookService bookService, IAuthorService authorService) =>
{
    var books = new[]
    {
        new BookStore.Common.Models.Book
        {
            Title = "The Great Gatsby",
            Author = "F. Scott Fitzgerald",
            ISBN = "978-0-7432-7356-5",
            Price = 12.99m,
            Genre = "Fiction",
            Description = "A classic American novel",
            StockQuantity = 50,
            PublishedDate = new DateTime(1925, 4, 10)
        },
        new BookStore.Common.Models.Book
        {
            Title = "To Kill a Mockingbird",
            Author = "Harper Lee",
            ISBN = "978-0-06-112008-4",
            Price = 14.99m,
            Genre = "Fiction",
            Description = "A gripping tale of racial injustice",
            StockQuantity = 35,
            PublishedDate = new DateTime(1960, 7, 11)
        },
        new BookStore.Common.Models.Book
        {
            Title = "1984",
            Author = "George Orwell",
            ISBN = "978-0-452-28423-4",
            Price = 13.99m,
            Genre = "Dystopian Fiction",
            Description = "A dystopian social science fiction novel",
            StockQuantity = 42,
            PublishedDate = new DateTime(1949, 6, 8)
        }
    };

    var authors = new[]
    {
        new BookStore.Common.Models.Author
        {
            Name = "F. Scott Fitzgerald",
            Bio = "American novelist and short story writer",
            BirthDate = new DateTime(1896, 9, 24),
            Nationality = "American"
        },
        new BookStore.Common.Models.Author
        {
            Name = "Harper Lee",
            Bio = "American novelist widely known for To Kill a Mockingbird",
            BirthDate = new DateTime(1926, 4, 28),
            Nationality = "American"
        },
        new BookStore.Common.Models.Author
        {
            Name = "George Orwell",
            Bio = "English novelist and journalist",
            BirthDate = new DateTime(1903, 6, 25),
            Nationality = "British"
        }
    };

    foreach (var book in books)
    {
        await bookService.CreateBookAsync(book);
    }

    foreach (var author in authors)
    {
        await authorService.CreateAuthorAsync(author);
    }

    return Results.Ok(new { message = "Sample data seeded successfully" });
});

app.Run();