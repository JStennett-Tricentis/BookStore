# BookStore Test Data Generator

Simple, focused test data generator for the BookStore API. Generates realistic JSON payloads for Books and Authors that match the actual API structure.

## Features

- Generate realistic Book and Author data
- Output as single object, array, or newline-delimited JSON
- Compact or pretty-printed output
- File output or stdout
- Matches actual BookStore API structure

## Book Data Structure

```json
{
  "Title": "The Silent Observer",
  "Author": "Alexander Smith",
  "ISBN": "978-1-0236-778-6",
  "Price": 42.58,
  "Genre": "Fiction",
  "Description": "A captivating tale that explores the depths of human nature",
  "StockQuantity": 34,
  "PublishedDate": "2020-11-23T00:00:00"
}
```

## Author Data Structure

```json
{
  "Name": "Alexander Smith",
  "Bio": "An acclaimed author known for thought-provoking narratives",
  "Nationality": "American",
  "BirthDate": "1965-03-15T00:00:00",
  "Website": "https://www.author-123.com"
}
```

## Usage

### Generate a single book

```bash
dotnet run -- --type book
```

### Generate 10 books as compact array

```bash
dotnet run -- --type book --count 10 --array --compact
```

### Generate author data to file

```bash
dotnet run -- --type author --output author.json
```

### Generate 50 books for load testing

```bash
dotnet run -- --type book --count 50 --output books.json --array
```

### Generate newline-delimited JSON (for k6)

```bash
dotnet run -- --type book --count 100 --output test-data.jsonl
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--type` | `-t` | Type of data: `book` or `author` | `book` |
| `--count` | `-n` | Number of records to generate | `1` |
| `--output` | `-o` | Output file path | stdout |
| `--compact` | | Output as compact JSON | pretty-printed |
| `--array` | | Output as JSON array | single object |
| `--help` | `-h` | Show help message | |

## Integration with k6

This tool is designed to work seamlessly with k6 performance tests:

```javascript
// In your k6 test
import { SharedArray } from 'k6/data';

const books = new SharedArray('books', function () {
    return JSON.parse(open('./books.json'));
});

export default function () {
    const book = books[Math.floor(Math.random() * books.length)];
    http.post(`${baseUrl}/api/v1/books`, JSON.stringify(book), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

## Differences from AI Hub RequestGenerator

This tool is intentionally simpler and focused on BookStore needs:

- **No LLM/AI features**: BookStore is a simple REST API, not an AI Hub
- **Simple JSON**: Just Books and Authors, no complex chat completions or embeddings
- **Focused scope**: Only generates test data, not full request configurations
- **Direct API match**: Data structure exactly matches BookStore API endpoints

## Development

```bash
# Build
dotnet build

# Run tests
dotnet test

# Format code
dotnet format
```
