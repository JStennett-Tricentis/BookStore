using System.Text.Json.Serialization;

namespace BookStore.Performance.RequestGenerator.Models;

/// <summary>
/// Represents an author in the BookStore system
/// </summary>
public class Author
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("bio")]
    public string Bio { get; set; } = string.Empty;

    [JsonPropertyName("nationality")]
    public string Nationality { get; set; } = string.Empty;

    [JsonPropertyName("birthDate")]
    public DateTime BirthDate { get; set; }

    [JsonPropertyName("website")]
    public string Website { get; set; } = string.Empty;
}
