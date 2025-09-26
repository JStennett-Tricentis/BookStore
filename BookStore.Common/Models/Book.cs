using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BookStore.Common.Models;

public class Book
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("author")]
    public string Author { get; set; } = string.Empty;

    [BsonElement("isbn")]
    public string ISBN { get; set; } = string.Empty;

    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("publishedDate")]
    public DateTime PublishedDate { get; set; }

    [BsonElement("genre")]
    public string Genre { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("stockQuantity")]
    public int StockQuantity { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}