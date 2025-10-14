using System.Text.Json;
using BookStore.Performance.RequestGenerator.Models;

namespace BookStore.Performance.RequestGenerator;

/// <summary>
/// BookStore Performance Test Data Generator
///
/// Generates realistic JSON payloads for Books and Authors API testing.
///
/// Examples:
///   # Generate a single book
///   dotnet run -- book
///
///   # Generate 10 books
///   dotnet run -- book --count 10
///
///   # Generate books and save to file
///   dotnet run -- book --count 5 --output books.json
///
///   # Generate an author
///   dotnet run -- author
///
///   # Generate compact JSON
///   dotnet run -- book --count 3 --compact
/// </summary>
class Program
{
    static async Task<int> Main(string[] args)
    {
        if (args.Length == 0 || args.Contains("--help") || args.Contains("-h"))
        {
            PrintHelp();
            return 0;
        }

        try
        {
            var options = ParseArgs(args);
            await Generate(options);
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            return 1;
        }
    }

    static void PrintHelp()
    {
        Console.WriteLine(@"BookStore Performance Test Data Generator

Usage: dotnet run -- <type> [OPTIONS]

Types:
  book         Generate book data
  author       Generate author data

Options:
  --count, -c      Number of items to generate (default: 1)
  --output, -o     Output file path (default: stdout)
  --compact        Output compact JSON (default: pretty-printed)
  --help, -h       Show this help message

Examples:
  # Single book
  dotnet run -- book

  # 10 books to file
  dotnet run -- book --count 10 --output books.json

  # 5 authors, compact format
  dotnet run -- author --count 5 --compact

  # Batch of books for load testing
  dotnet run -- book --count 100 --output test-data/books-batch.json
");
    }

    static Options ParseArgs(string[] args)
    {
        var options = new Options();

        if (args.Length > 0)
        {
            options.Type = args[0].ToLower();
        }

        for (int i = 1; i < args.Length; i++)
        {
            switch (args[i].ToLower())
            {
                case "--count":
                case "-c":
                    options.Count = int.Parse(GetNextArg(args, ref i));
                    break;
                case "--output":
                case "-o":
                    options.Output = GetNextArg(args, ref i);
                    break;
                case "--compact":
                    options.Compact = true;
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

    class Options
    {
        public string Type { get; set; } = "book";
        public int Count { get; set; } = 1;
        public string? Output { get; set; }
        public bool Compact { get; set; }
    }

    static async Task Generate(Options options)
    {
        var jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = !options.Compact,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        string json;

        if (options.Type == "book")
        {
            if (options.Count == 1)
            {
                var book = DataGenerator.GenerateBook();
                json = JsonSerializer.Serialize(book, jsonOptions);
            }
            else
            {
                var books = Enumerable.Range(0, options.Count)
                    .Select(_ => DataGenerator.GenerateBook())
                    .ToList();
                json = JsonSerializer.Serialize(books, jsonOptions);
            }
        }
        else if (options.Type == "author")
        {
            if (options.Count == 1)
            {
                var author = DataGenerator.GenerateAuthor();
                json = JsonSerializer.Serialize(author, jsonOptions);
            }
            else
            {
                var authors = Enumerable.Range(0, options.Count)
                    .Select(_ => DataGenerator.GenerateAuthor())
                    .ToList();
                json = JsonSerializer.Serialize(authors, jsonOptions);
            }
        }
        else
        {
            throw new ArgumentException($"Unknown type: {options.Type}. Use 'book' or 'author'");
        }

        // Output
        if (!string.IsNullOrEmpty(options.Output))
        {
            // Ensure directory exists
            var directory = Path.GetDirectoryName(options.Output);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await File.WriteAllTextAsync(options.Output, json);
            var format = options.Compact ? "compact" : "pretty-printed";
            Console.Error.WriteLine($"✓ Generated {options.Count} {options.Type}(s) saved to: {options.Output} ({format})");
        }
        else
        {
            Console.WriteLine(json);
        }
    }
}
