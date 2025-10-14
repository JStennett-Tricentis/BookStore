# BookStore Performance Request Generator

Simple C# tool to generate realistic JSON payloads for BookStore API performance testing.

## What It Does

Generates test data for:

- **Books**: title, author, ISBN, price, genre, description, stock, publishedDate
- **Authors**: name, bio, nationality, birthDate, website

## Usage

```bash
# Generate a single book
dotnet run -- book

# Generate 10 books
dotnet run -- book --count 10

# Save to file
dotnet run -- book --count 5 --output books.json

# Generate an author
dotnet run -- author

# Compact JSON (no pretty-print)
dotnet run -- book --count 3 --compact

# Batch generation for load tests
dotnet run -- book --count 100 --output test-data/books-batch.json
```

## Options

- `book` - Generate book data
- `author` - Generate author data
- `--count, -c` - Number of items (default: 1)
- `--output, -o` - Output file path (default: stdout)
- `--compact` - Output compact JSON
- `--help, -h` - Show help

## Example Output

### Book

```json
{
  "title": "The Silent Observer",
  "author": "Alexander Smith",
  "isbn": "978-3-1234-567-8",
  "price": 24.99,
  "genre": "Mystery",
  "description": "A gripping narrative that keeps you on the edge of your seat",
  "stockQuantity": 42,
  "publishedDate": "2023-06-15T00:00:00"
}
```

### Author

```json
{
  "name": "Emma Johnson",
  "bio": "A bestselling writer with a passion for storytelling",
  "nationality": "British",
  "birthDate": "1975-03-22T00:00:00",
  "website": "https://www.author-4567.com"
}
```

## Use Cases

1. **K6 Performance Tests** - Generate bulk test data for load tests
2. **Manual API Testing** - Quick payloads for Postman/curl
3. **Seed Data** - Populate test databases
4. **Experimentation** - Test different scenarios locally without wasting tokens

## Differences from AI Hub RequestGenerator

This is a **simplified version** focused specifically on BookStore's REST API:

| AI Hub Version | BookStore Version |
|----------------|-------------------|
| LLM chat/completion requests | Simple REST CRUD payloads |
| Complex with tools, streaming, etc | Just Book and Author models |
| Multiple providers/endpoints | Single API structure |
| ~2000 lines of code | ~300 lines of code |

Perfect for local experimentation without the complexity of the full AI Hub generator!
