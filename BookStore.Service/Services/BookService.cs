using BookStore.Common.Models;
using Microsoft.Extensions.Caching.Distributed;
using MongoDB.Driver;
using System.Text.Json;

namespace BookStore.Service.Services;

public class BookService : IBookService
{
    private readonly IMongoCollection<Book> _books;
    private readonly IDistributedCache _cache;
    private readonly ILogger<BookService> _logger;
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
        var cacheKey = $"books:{genre}:{author}:{page}:{pageSize}";
        var cachedBooks = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedBooks))
        {
            _logger.LogDebug("Retrieved books from cache");
            return JsonSerializer.Deserialize<IEnumerable<Book>>(cachedBooks) ?? [];
        }

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

        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(books), cacheOptions);
        _logger.LogDebug("Cached books result");

        return books;
    }

    public async Task<Book?> GetBookByIdAsync(string id)
    {
        var cacheKey = $"book:{id}";
        var cachedBook = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedBook))
        {
            _logger.LogDebug("Retrieved book {BookId} from cache", id);
            return JsonSerializer.Deserialize<Book>(cachedBook);
        }

        var book = await _books.Find(b => b.Id == id).FirstOrDefaultAsync();

        if (book != null)
        {
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
            };

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(book), cacheOptions);
            _logger.LogDebug("Cached book {BookId}", id);
        }

        return book;
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
        await Task.CompletedTask;
    }
}