using BookStore.Common.Models;
using Microsoft.Extensions.Caching.Distributed;
using MongoDB.Driver;
using System.Text.Json;

namespace BookStore.Service.Services;

public class AuthorService : IAuthorService
{
    private readonly IMongoCollection<Author> _authors;
    private readonly IDistributedCache _cache;
    private readonly ILogger<AuthorService> _logger;
    private const int CacheExpirationMinutes = 15;

    public AuthorService(
        IMongoDatabase database,
        IDistributedCache cache,
        ILogger<AuthorService> logger)
    {
        _authors = database.GetCollection<Author>("authors");
        _cache = cache;
        _logger = logger;
    }

    public async Task<IEnumerable<Author>> GetAuthorsAsync(int page = 1, int pageSize = 10)
    {
        // Temporarily bypass cache to debug the issue
        _logger.LogDebug("Getting authors: page={Page}, pageSize={PageSize}", page, pageSize);

        var authors = await _authors.Find(_ => true)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        _logger.LogInformation("Found {Count} authors from database", authors.Count);

        // Re-enable caching later
        /*
        var cacheKey = $"authors:{page}:{pageSize}";
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
        };

        try
        {
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(authors), cacheOptions);
            _logger.LogDebug("Cached authors result");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache authors result");
        }
        */

        return authors;
    }

    public async Task<Author?> GetAuthorByIdAsync(string id)
    {
        var cacheKey = $"author:{id}";
        var cachedAuthor = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedAuthor))
        {
            _logger.LogDebug("Retrieved author {AuthorId} from cache", id);
            return JsonSerializer.Deserialize<Author>(cachedAuthor);
        }

        var author = await _authors.Find(a => a.Id == id).FirstOrDefaultAsync();

        if (author != null)
        {
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CacheExpirationMinutes)
            };

            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(author), cacheOptions);
            _logger.LogDebug("Cached author {AuthorId}", id);
        }

        return author;
    }

    public async Task<Author> CreateAuthorAsync(Author author)
    {
        author.CreatedAt = DateTime.UtcNow;
        author.UpdatedAt = DateTime.UtcNow;

        await _authors.InsertOneAsync(author);
        _logger.LogInformation("Created author {AuthorId}: {Name}", author.Id, author.Name);

        await InvalidateRelatedCaches();

        return author;
    }

    public async Task<Author?> UpdateAuthorAsync(string id, Author author)
    {
        author.Id = id;
        author.UpdatedAt = DateTime.UtcNow;

        var result = await _authors.ReplaceOneAsync(a => a.Id == id, author);

        if (result.MatchedCount == 0)
        {
            return null;
        }

        await InvalidateAuthorCache(id);
        await InvalidateRelatedCaches();

        _logger.LogInformation("Updated author {AuthorId}: {Name}", author.Id, author.Name);

        return author;
    }

    public async Task<bool> DeleteAuthorAsync(string id)
    {
        var result = await _authors.DeleteOneAsync(a => a.Id == id);

        if (result.DeletedCount > 0)
        {
            await InvalidateAuthorCache(id);
            await InvalidateRelatedCaches();
            _logger.LogInformation("Deleted author {AuthorId}", id);
        }

        return result.DeletedCount > 0;
    }

    private async Task InvalidateAuthorCache(string id)
    {
        await _cache.RemoveAsync($"author:{id}");
    }

    private async Task InvalidateRelatedCaches()
    {
        // Clear author list cache entries
        var cacheKeysToRemove = new List<string>();

        // Generate common cache key patterns to clear
        for (int page = 1; page <= 10; page++)
        {
            for (int pageSize = 10; pageSize <= 100; pageSize += 10)
            {
                cacheKeysToRemove.Add($"authors:{page}:{pageSize}");
            }
        }

        // Remove the cache entries
        var tasks = cacheKeysToRemove.Select(key => _cache.RemoveAsync(key));
        await Task.WhenAll(tasks);

        _logger.LogDebug("Invalidated related author caches");
    }
}
