namespace BookStore.Performance.RequestGenerator.Models;

/// <summary>
/// Generates realistic test data for Books and Authors
/// </summary>
public static class DataGenerator
{
    private static readonly Random Random = new();

    private static readonly string[] Titles =
    [
        "The Silent Observer", "Midnight Chronicles", "The Last Symphony",
        "Desert Winds", "City of Shadows", "The Golden Key",
        "River's End", "Mountain Peak", "Ocean's Call",
        "Forest Whispers", "Starlight Dreams", "The Forgotten Path",
        "Crimson Horizons", "Eternal Echoes", "Whispers in the Dark",
        "The Hidden Truth", "Beyond the Veil", "Dancing with Fate",
        "The Keeper's Secret", "Shadows of Tomorrow"
    ];

    private static readonly string[] AuthorNames =
    [
        "Alexander Smith", "Emma Johnson", "Michael Brown",
        "Sarah Wilson", "David Lee", "Lisa Chen",
        "Robert Taylor", "Jessica Davis", "Christopher White",
        "Amanda Garcia", "John Martinez", "Maria Rodriguez",
        "James Anderson", "Patricia Thomas", "Daniel Jackson"
    ];

    private static readonly string[] Genres =
    [
        "Fiction", "Mystery", "Romance", "Thriller",
        "Science Fiction", "Fantasy", "Biography", "History",
        "Adventure", "Drama", "Horror", "Contemporary"
    ];

    private static readonly string[] Descriptions =
    [
        "A captivating tale that explores the depths of human nature",
        "An epic adventure that spans across continents and cultures",
        "A thought-provoking story about love, loss, and redemption",
        "A gripping narrative that keeps you on the edge of your seat",
        "An inspiring journey of self-discovery and personal growth",
        "A masterfully crafted exploration of complex relationships",
        "A powerful story of resilience and determination",
        "An unforgettable tale of courage and sacrifice"
    ];

    private static readonly string[] Nationalities =
    [
        "American", "British", "Canadian", "Australian",
        "French", "German", "Italian", "Spanish",
        "Japanese", "Chinese", "Indian", "Brazilian"
    ];

    private static readonly string[] Bios =
    [
        "An acclaimed author known for thought-provoking narratives",
        "A bestselling writer with a passion for storytelling",
        "An award-winning novelist celebrated for complex characters",
        "A prolific author whose works span multiple genres",
        "A contemporary writer exploring modern themes",
        "A master storyteller with decades of experience",
        "An innovative voice in modern literature"
    ];

    public static Book GenerateBook()
    {
        return new Book
        {
            Title = RandomItem(Titles),
            Author = RandomItem(AuthorNames),
            Isbn = GenerateIsbn(),
            Price = Math.Round((decimal)(Random.NextDouble() * 40 + 10), 2),
            Genre = RandomItem(Genres),
            Description = RandomItem(Descriptions),
            StockQuantity = Random.Next(1, 100),
            PublishedDate = GenerateRandomDate(2000, 2024)
        };
    }

    public static Author GenerateAuthor()
    {
        return new Author
        {
            Name = RandomItem(AuthorNames),
            Bio = RandomItem(Bios),
            Nationality = RandomItem(Nationalities),
            BirthDate = GenerateRandomDate(1940, 2000),
            Website = $"https://www.author-{Random.Next(1000, 9999)}.com"
        };
    }

    private static string GenerateIsbn()
    {
        return $"978-{Random.Next(0, 10)}-{Random.Next(1000, 9999)}-{Random.Next(100, 999)}-{Random.Next(0, 10)}";
    }

    private static DateTime GenerateRandomDate(int startYear, int endYear)
    {
        var start = new DateTime(startYear, 1, 1);
        var end = new DateTime(endYear, 12, 31);
        var range = (end - start).Days;
        return start.AddDays(Random.Next(range));
    }

    private static T RandomItem<T>(T[] array)
    {
        return array[Random.Next(array.Length)];
    }
}
