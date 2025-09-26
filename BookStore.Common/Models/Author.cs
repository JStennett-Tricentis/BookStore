using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace BookStore.Common.Models;

public class Author
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("bio")]
    public string Bio { get; set; } = string.Empty;

    [BsonElement("birthDate")]
    public DateTime? BirthDate { get; set; }

    [BsonElement("nationality")]
    public string Nationality { get; set; } = string.Empty;

    [BsonElement("website")]
    public string Website { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}