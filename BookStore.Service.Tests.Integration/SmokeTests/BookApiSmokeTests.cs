using System.Net;
using System.Net.Http.Json;
using System.Text;
using BookStore.Common.Models;
using FluentAssertions;
using Newtonsoft.Json;
using Xunit;

namespace BookStore.Service.Tests.Integration.SmokeTests;

[Collection("Sequential")]
public class BookApiSmokeTests : IClassFixture<BookStoreApiFactory>
{
    private readonly HttpClient _client;
    private readonly BookStoreApiFactory _factory;

    public BookApiSmokeTests(BookStoreApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetBooks_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/books");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var books = await response.Content.ReadFromJsonAsync<List<Book>>();
        books.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBookById_WithValidId_ReturnsBook()
    {
        // Arrange - First create a book
        var newBook = new Book
        {
            Title = $"Test Book {Guid.NewGuid()}",
            Author = "Test Author",
            ISBN = $"978-{Random.Shared.Next(1000000000, int.MaxValue)}",
            Price = 29.99m,
            PublishedDate = DateTime.UtcNow.AddYears(-1),
            Genre = "Test",
            Description = "Test book for smoke tests",
            StockQuantity = 10
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/books", newBook);
        createResponse.EnsureSuccessStatusCode();
        var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

        // Act
        var response = await _client.GetAsync($"/api/v1/books/{createdBook!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var book = await response.Content.ReadFromJsonAsync<Book>();
        book.Should().NotBeNull();
        book!.Id.Should().Be(createdBook.Id);
        book.Title.Should().Be(newBook.Title);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/books/{createdBook.Id}");
    }

    [Fact]
    public async Task GetBookById_WithInvalidId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/books/000000000000000000000000");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateBook_WithValidData_ReturnsCreated()
    {
        // Arrange
        var newBook = new Book
        {
            Title = $"Test Book {Guid.NewGuid()}",
            Author = "Test Author",
            ISBN = $"978-{Random.Shared.Next(1000000000, int.MaxValue)}",
            Price = 29.99m,
            PublishedDate = DateTime.UtcNow.AddYears(-1),
            Genre = "Test",
            Description = "Test book for smoke tests",
            StockQuantity = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/books", newBook);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdBook = await response.Content.ReadFromJsonAsync<Book>();
        createdBook.Should().NotBeNull();
        createdBook!.Title.Should().Be(newBook.Title);
        createdBook.Id.Should().NotBeNullOrEmpty();

        // Cleanup
        await _client.DeleteAsync($"/api/v1/books/{createdBook.Id}");
    }

    [Fact]
    public async Task UpdateBook_WithValidData_ReturnsOk()
    {
        // Arrange - First create a book
        var newBook = new Book
        {
            Title = $"Test Book {Guid.NewGuid()}",
            Author = "Test Author",
            ISBN = $"978-{Random.Shared.Next(1000000000, int.MaxValue)}",
            Price = 29.99m,
            PublishedDate = DateTime.UtcNow.AddYears(-1),
            Genre = "Test",
            Description = "Test book for smoke tests",
            StockQuantity = 10
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/books", newBook);
        createResponse.EnsureSuccessStatusCode();
        var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

        // Update the book
        createdBook!.Title = "Updated Title";
        createdBook.Price = 39.99m;

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/books/{createdBook.Id}", createdBook);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedBook = await response.Content.ReadFromJsonAsync<Book>();
        updatedBook.Should().NotBeNull();
        updatedBook!.Title.Should().Be("Updated Title");
        updatedBook.Price.Should().Be(39.99m);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/books/{createdBook.Id}");
    }

    [Fact]
    public async Task DeleteBook_WithValidId_ReturnsNoContent()
    {
        // Arrange - First create a book
        var newBook = new Book
        {
            Title = $"Test Book {Guid.NewGuid()}",
            Author = "Test Author",
            ISBN = $"978-{Random.Shared.Next(1000000000, int.MaxValue)}",
            Price = 29.99m,
            PublishedDate = DateTime.UtcNow.AddYears(-1),
            Genre = "Test",
            Description = "Test book to be deleted",
            StockQuantity = 10
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/books", newBook);
        createResponse.EnsureSuccessStatusCode();
        var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/books/{createdBook!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify book is deleted
        var getResponse = await _client.GetAsync($"/api/v1/books/{createdBook.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task SearchBooks_WithQuery_ReturnsResults()
    {
        // Arrange - Create a book with unique title
        var uniqueTitle = $"Unique Book {Guid.NewGuid()}";
        var newBook = new Book
        {
            Title = uniqueTitle,
            Author = "Test Author",
            ISBN = $"978-{Random.Shared.Next(1000000000, int.MaxValue)}",
            Price = 29.99m,
            PublishedDate = DateTime.UtcNow.AddYears(-1),
            Genre = "Test",
            Description = "Test book for search",
            StockQuantity = 10
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/books", newBook);
        createResponse.EnsureSuccessStatusCode();
        var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

        // Act
        var searchTerm = uniqueTitle.Split(' ')[1]; // Search for "Book"
        var response = await _client.GetAsync($"/api/v1/books/search?query={searchTerm}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var searchResults = await response.Content.ReadFromJsonAsync<List<Book>>();
        searchResults.Should().NotBeNull();
        searchResults!.Should().Contain(b => b.Title == uniqueTitle);

        // Cleanup
        await _client.DeleteAsync($"/api/v1/books/{createdBook!.Id}");
    }

    [Fact]
    public async Task CreateBook_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange - Book with missing required fields
        var invalidBook = new Book
        {
            Title = "", // Empty title
            Price = -10 // Negative price
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/books", invalidBook);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetBooks_ResponseTimeUnder1Second()
    {
        // Arrange
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var response = await _client.GetAsync("/api/v1/books");

        // Assert
        stopwatch.Stop();
        response.EnsureSuccessStatusCode();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000, "API should respond within 1 second");
    }
}