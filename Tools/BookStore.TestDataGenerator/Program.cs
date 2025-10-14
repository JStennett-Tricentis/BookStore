using System.Text.Json;

namespace BookStore.TestDataGenerator;

/// <summary>
/// Simple test data generator for BookStore API
/// Generates JSON for Books and Authors matching the actual API structure
/// </summary>
class Program
{
    static void Main(string[] args)
    {
        if (args.Length == 0 || args.Contains("--help") || args.Contains("-h"))
        {
            PrintHelp();
            return;
        }

        try
        {
            var options = ParseArgs(args);
            Generate(options);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            Environment.Exit(1);
        }
    }

    static void PrintHelp()
    {
        Console.WriteLine(@"BookStore Test Data Generator

Usage: dotnet run -- [OPTIONS]

Options:
  --type, -t          Type of data: book, author (default: book)
  --count, -n         Number of records to generate (default: 1)
  --output, -o        Output file path (default: stdout)
  --compact           Output as compact JSON (default: pretty-printed)
  --array             Output as JSON array (default: single object or newline-delimited)
  --help, -h          Show this help message

Examples:
  # Generate a single book
  dotnet run -- --type book

  # Generate 10 books as compact array
  dotnet run -- --type book --count 10 --array --compact

  # Generate author data to file
  dotnet run -- --type author --output author.json

  # Generate 50 books for load testing
  dotnet run -- --type book --count 50 --output books.json --array
");
    }

    static Options ParseArgs(string[] args)
    {
        var options = new Options();

        for (int i = 0; i < args.Length; i++)
        {
            switch (args[i].ToLower())
            {
                case "--type":
                case "-t":
                    options.Type = GetNextArg(args, ref i);
                    break;
                case "--count":
                case "-n":
                    options.Count = int.Parse(GetNextArg(args, ref i));
                    break;
                case "--output":
                case "-o":
                    options.Output = GetNextArg(args, ref i);
                    break;
                case "--compact":
                    options.Compact = true;
                    break;
                case "--array":
                    options.Array = true;
                    break;
            }
        }

        return options;
    }

    static string GetNextArg(string[] args, ref int index)
    {
        if (index + 1 >= args.Length)
        {
            throw new ArgumentException($"Missing value for {args[index]}");
        }
        return args[++index];
    }

    static void Generate(Options options)
    {
        var jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = !options.Compact,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        string output;

        if (options.Count == 1 && !options.Array)
        {
            // Generate single object
            var data = options.Type.ToLower() == "author"
                ? (object)GenerateAuthor()
                : (object)GenerateBook();
            output = JsonSerializer.Serialize(data, jsonOptions);
        }
        else if (options.Array)
        {
            // Generate array
            var items = new List<object>();
            for (int i = 0; i < options.Count; i++)
            {
                items.Add(options.Type.ToLower() == "author"
                    ? (object)GenerateAuthor()
                    : (object)GenerateBook());
            }
            output = JsonSerializer.Serialize(items, jsonOptions);
        }
        else
        {
            // Generate newline-delimited JSON
            var lines = new List<string>();
            for (int i = 0; i < options.Count; i++)
            {
                var data = options.Type.ToLower() == "author"
                    ? (object)GenerateAuthor()
                    : (object)GenerateBook();
                lines.Add(JsonSerializer.Serialize(data, jsonOptions));
            }
            output = string.Join(Environment.NewLine, lines);
        }

        if (!string.IsNullOrEmpty(options.Output))
        {
            File.WriteAllText(options.Output, output);
            Console.Error.WriteLine($"Generated {options.Count} {options.Type}(s) -> {options.Output}");
        }
        else
        {
            Console.WriteLine(output);
        }
    }

    static Book GenerateBook()
    {
        var random = new Random();

        var titles = new[] {
            "The Silent Observer", "Midnight Chronicles", "The Last Symphony",
            "Desert Winds", "City of Shadows", "The Golden Key", "River's End",
            "Mountain Peak", "Ocean's Call", "Forest Whispers", "Starlight Dreams",
            "The Hidden Path", "Echoes of Time", "Crystal Lake", "Winter's Tale"
        };

        var authors = new[] {
            "Alexander Smith", "Emma Johnson", "Michael Brown", "Sarah Wilson",
            "David Lee", "Lisa Chen", "Robert Taylor", "Jessica Davis",
            "Christopher White", "Amanda Garcia", "John Martinez", "Maria Rodriguez"
        };

        var genres = new[] {
            "Fiction", "Mystery", "Romance", "Thriller", "Science Fiction",
            "Fantasy", "Biography", "History", "Adventure", "Drama"
        };

        var descriptions = new[] {
            "A captivating tale that explores the depths of human nature",
            "An epic adventure that spans across continents and cultures",
            "A thought-provovoking story about love, loss, and redemption",
            "A gripping narrative that keeps you on the edge of your seat",
            "An inspiring journey of self-discovery and personal growth"
        };

        return new Book
        {
            Title = titles[random.Next(titles.Length)],
            Author = authors[random.Next(authors.Length)],
            ISBN = $"978-{random.Next(10)}-{random.Next(10000):D4}-{random.Next(1000):D3}-{random.Next(10)}",
            Price = Math.Round(random.NextDouble() * 40 + 10, 2),
            Genre = genres[random.Next(genres.Length)],
            Description = descriptions[random.Next(descriptions.Length)],
            StockQuantity = random.Next(1, 101),
            PublishedDate = new DateTime(
                2000 + random.Next(25),
                random.Next(1, 13),
                random.Next(1, 29)
            )
        };
    }

    static Author GenerateAuthor()
    {
        var random = new Random();

        var names = new[] {
            "Alexander Smith", "Emma Johnson", "Michael Brown", "Sarah Wilson",
            "David Lee", "Lisa Chen", "Robert Taylor", "Jessica Davis",
            "Christopher White", "Amanda Garcia", "John Martinez", "Maria Rodriguez"
        };

        var nationalities = new[] {
            "American", "British", "Canadian", "Australian", "French",
            "German", "Italian", "Spanish", "Japanese", "Chinese"
        };

        var bios = new[] {
            "An acclaimed author known for thought-provoking narratives",
            "A bestselling writer with a passion for storytelling",
            "An award-winning novelist celebrated for complex characters",
            "A prolific author whose works span multiple genres",
            "A contemporary writer exploring modern themes"
        };

        return new Author
        {
            Name = names[random.Next(names.Length)],
            Bio = bios[random.Next(bios.Length)],
            Nationality = nationalities[random.Next(nationalities.Length)],
            BirthDate = new DateTime(
                1940 + random.Next(60),
                random.Next(1, 13),
                random.Next(1, 29)
            ),
            Website = $"https://www.author-{random.Next(1000)}.com"
        };
    }

    class Options
    {
        public string Type { get; set; } = "book";
        public int Count { get; set; } = 1;
        public string? Output { get; set; }
        public bool Compact { get; set; }
        public bool Array { get; set; }
    }
}

public class Book
{
    public string Title { get; set; } = "";
    public string Author { get; set; } = "";
    public string ISBN { get; set; } = "";
    public double Price { get; set; }
    public string Genre { get; set; } = "";
    public string Description { get; set; } = "";
    public int StockQuantity { get; set; }
    public DateTime PublishedDate { get; set; }
}

public class Author
{
    public string Name { get; set; } = "";
    public string Bio { get; set; } = "";
    public string Nationality { get; set; } = "";
    public DateTime BirthDate { get; set; }
    public string Website { get; set; } = "";
}
