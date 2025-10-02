using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Order;
using BookStore.Common.Models;
using System.Text.Json;

namespace BookStore.Benchmarks;

/// <summary>
/// Benchmarks different JSON serialization approaches for Book entities.
/// This demonstrates micro-benchmarking that K6 cannot do - comparing
/// different implementations at the code level without HTTP overhead.
/// </summary>
[MemoryDiagnoser]
[Orderer(SummaryOrderPolicy.FastestToSlowest)]
[RankColumn]
public class JsonSerializationBenchmarks
{
    private Book _book = null!;
    private JsonSerializerOptions _options = null!;
    private string _json = null!;

    [GlobalSetup]
    public void Setup()
    {
        _book = new Book
        {
            Id = "507f1f77bcf86cd799439011",
            Title = "The Great Gatsby",
            Author = "F. Scott Fitzgerald",
            ISBN = "978-0743273565",
            PublishedDate = new DateTime(1925, 4, 10),
            Genre = "Classic Literature",
            Price = 14.99m,
            StockQuantity = 150,
            Description = "A novel set in the Jazz Age that tells the tragic story of Jay Gatsby"
        };

        _options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        _json = JsonSerializer.Serialize(_book, _options);
    }

    [Benchmark(Baseline = true)]
    public string Serialize_SystemTextJson()
    {
        return JsonSerializer.Serialize(_book, _options);
    }

    [Benchmark]
    public Book? Deserialize_SystemTextJson()
    {
        return JsonSerializer.Deserialize<Book>(_json, _options);
    }

    [Benchmark]
    public string Serialize_WithoutOptions()
    {
        return JsonSerializer.Serialize(_book);
    }

    [Benchmark]
    public Book? RoundTrip()
    {
        var json = JsonSerializer.Serialize(_book, _options);
        return JsonSerializer.Deserialize<Book>(json, _options);
    }
}
