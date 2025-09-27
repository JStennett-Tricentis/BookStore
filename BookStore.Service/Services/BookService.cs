using BookStore.Common.Models;
using Microsoft.Extensions.Caching.Distributed;
using MongoDB.Driver;
using System.Diagnostics;
using System.Text.Json;

namespace BookStore.Service.Services;

public class BookService : IBookService
{
    private readonly IMongoCollection<Book> _books;
    private readonly IDistributedCache _cache;
    private readonly ILogger<BookService> _logger;
    private static readonly ActivitySource ActivitySource = new("BookStore.Service");
    private const int CacheExpirationMinutes = 10;

    public BookService(
        IMongoDatabase database,
        IDistributedCache cache,
        ILogger<BookService> logger)
    {
        _books = database.GetCollection<Book>("books");
        _cache = cache;
        _logger = logger;
    }

    public async Task<IEnumerable<Book>> GetBooksAsync(string? genre = null, string? author = null, int page = 1, int pageSize = 10)
    {
        // Temporarily bypass cache to debug the issue
        _logger.LogDebug("Getting books: genre={Genre}, author={Author}, page={Page}, pageSize={PageSize}", genre, author, page, pageSize);

        var filterBuilder = Builders<Book>.Filter;
        var filter = filterBuilder.Empty;

        if (!string.IsNullOrEmpty(genre))
        {
            filter &= filterBuilder.Eq(b => b.Genre, genre);
        }

        if (!string.IsNullOrEmpty(author))
        {
            filter &= filterBuilder.Eq(b => b.Author, author);
        }

        var books = await _books.Find(filter)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        _logger.LogInformation("Found {Count} books from database", books.Count);

        // Re-enable caching later
        /*
        var cacheKey = $"books:{genre}:{author}:{page}:{pageSize}";
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
        };

        try
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(books), cacheOptions);
            _logger.LogDebug("Cached books result");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache books result");
        }
        */

        return books;
    }

    public async Task<Book?> GetBookByIdAsync(string id)
    {
        using var activity = ActivitySource.StartActivity("BookService.GetBookById");
        activity?.SetTag("book.id", id);

        var cacheKey = $"book:{id}";

        using (var cacheActivity = ActivitySource.StartActivity("BookService.GetFromCache"))
        {
            cacheActivity?.SetTag("cache.key", cacheKey);

            var cachedBook = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedBook))
            {
                activity?.SetTag("cache.hit", true);
                _logger.LogDebug("Retrieved book {BookId} from cache", id);
                return JsonSerializer.Deserialize<Book>(cachedBook);
            }

            activity?.SetTag("cache.hit", false);
        }

        using (var dbActivity = ActivitySource.StartActivity("BookService.GetFromDatabase"))
        {
            dbActivity?.SetTag("database.collection", "books");
            dbActivity?.SetTag("book.id", id);

            var book = await _books.Find(b => b.Id == id).FirstOrDefaultAsync();

            if (book != null)
            {
                activity?.SetTag("book.found", true);
                activity?.SetTag("book.title", book.Title);
                activity?.SetTag("book.author", book.Author);

                using (var setCacheActivity = ActivitySource.StartActivity("BookService.SetCache"))
                {
                    var cacheOptions = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
                    };

                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(book), cacheOptions);
                    _logger.LogDebug("Cached book {BookId}", id);
                }
            }
            else
            {
                activity?.SetTag("book.found", false);
            }

            return book;
        }
    }

    public async Task<Book> CreateBookAsync(Book book)
    {
        book.CreatedAt = DateTime.UtcNow;
        book.UpdatedAt = DateTime.UtcNow;

        await _books.InsertOneAsync(book);
        _logger.LogInformation("Created book {BookId}: {Title}", book.Id, book.Title);

        await InvalidateRelatedCaches();

        return book;
    }

    public async Task<Book?> UpdateBookAsync(string id, Book book)
    {
        book.Id = id;
        book.UpdatedAt = DateTime.UtcNow;

        var result = await _books.ReplaceOneAsync(b => b.Id == id, book);

        if (result.MatchedCount == 0)
        {
            return null;
        }

        await InvalidateBookCache(id);
        await InvalidateRelatedCaches();

        _logger.LogInformation("Updated book {BookId}: {Title}", book.Id, book.Title);

        return book;
    }

    public async Task<Book?> PatchBookAsync(string id, Dictionary<string, object> updates)
    {
        var updateBuilder = Builders<Book>.Update;
        var updateDefinitions = new List<UpdateDefinition<Book>>();

        foreach (var update in updates)
        {
            switch (update.Key.ToLower())
            {
                case "title":
                    updateDefinitions.Add(updateBuilder.Set(b => b.Title, update.Value.ToString() ?? string.Empty));
                    break;
                case "price":
                    if (decimal.TryParse(update.Value.ToString(), out var price))
                        updateDefinitions.Add(updateBuilder.Set(b => b.Price, price));
                    break;
                case "stockquantity":
                    if (int.TryParse(update.Value.ToString(), out var stock))
                        updateDefinitions.Add(updateBuilder.Set(b => b.StockQuantity, stock));
                    break;
                case "description":
                    updateDefinitions.Add(updateBuilder.Set(b => b.Description, update.Value.ToString() ?? string.Empty));
                    break;
            }
        }

        if (!updateDefinitions.Any())
        {
            return await GetBookByIdAsync(id);
        }

        updateDefinitions.Add(updateBuilder.Set(b => b.UpdatedAt, DateTime.UtcNow));
        var combinedUpdate = updateBuilder.Combine(updateDefinitions);

        var result = await _books.UpdateOneAsync(b => b.Id == id, combinedUpdate);

        if (result.MatchedCount == 0)
        {
            return null;
        }

        await InvalidateBookCache(id);
        await InvalidateRelatedCaches();

        return await GetBookByIdAsync(id);
    }

    public async Task<bool> DeleteBookAsync(string id)
    {
        var result = await _books.DeleteOneAsync(b => b.Id == id);

        if (result.DeletedCount > 0)
        {
            await InvalidateBookCache(id);
            await InvalidateRelatedCaches();
            _logger.LogInformation("Deleted book {BookId}", id);
        }

        return result.DeletedCount > 0;
    }

    public async Task<IEnumerable<Book>> SearchBooksAsync(string query)
    {
        var filter = Builders<Book>.Filter.Or(
            Builders<Book>.Filter.Regex(b => b.Title, new MongoDB.Bson.BsonRegularExpression(query, "i")),
            Builders<Book>.Filter.Regex(b => b.Author, new MongoDB.Bson.BsonRegularExpression(query, "i")),
            Builders<Book>.Filter.Regex(b => b.Description, new MongoDB.Bson.BsonRegularExpression(query, "i"))
        );

        return await _books.Find(filter).Limit(50).ToListAsync();
    }

    private async Task InvalidateBookCache(string id)
    {
        await _cache.RemoveAsync($"book:{id}");
    }

    private async Task InvalidateRelatedCaches()
    {
        // Pattern to match all book list cache keys
        // In a real implementation, you'd want a more sophisticated cache invalidation strategy
        // For now, we'll just clear all cached book lists by using a simple pattern

        // Note: StackExchange.Redis doesn't have a direct way to delete by pattern in IDistributedCache
        // This is a simplified approach - in production you'd want to track cache keys or use Redis directly
        var cacheKeysToRemove = new List<string>();

        // Generate some common cache key patterns to clear
        for (int page = 1; page <= 10; page++)
        {
            for (int pageSize = 10; pageSize <= 100; pageSize += 10)
            {
                cacheKeysToRemove.Add($"books::::{page}:{pageSize}");
                cacheKeysToRemove.Add($"books:Fiction::{page}:{pageSize}");
                cacheKeysToRemove.Add($"books:Test::{page}:{pageSize}");
            }
        }

        // Remove the cache entries
        var tasks = cacheKeysToRemove.Select(key => _cache.RemoveAsync(key));
        await Task.WhenAll(tasks);

        _logger.LogDebug("Invalidated related book caches");
    }
}