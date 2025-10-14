using System.Text.Json.Serialization;

namespace BookStore.Performance.RequestGenerator.Models;

/// <summary>
/// Represents a book in the BookStore system
/// </summary>
public class Book
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("isbn")]
    public string Isbn { get; set; } = string.Empty;

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("genre")]
    public string Genre { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("stockQuantity")]
    public int StockQuantity { get; set; }

    [JsonPropertyName("publishedDate")]
    public DateTime PublishedDate { get; set; }
}
