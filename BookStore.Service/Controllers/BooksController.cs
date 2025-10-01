using BookStore.Common.Models;
using BookStore.Service.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Service.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;
    private readonly IClaudeService _claudeService;
    private readonly ILogger<BooksController> _logger;

    public BooksController(IBookService bookService, IClaudeService claudeService, ILogger<BooksController> logger)
    {
        _bookService = bookService;
        _claudeService = claudeService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Book>>> GetBooks(
        [FromQuery] string? genre = null,
        [FromQuery] string? author = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var books = await _bookService.GetBooksAsync(genre, author, page, pageSize);
            return Ok(books);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting books");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Book>> GetBook(string id)
    {
        try
        {
            var book = await _bookService.GetBookByIdAsync(id);
            if (book == null)
            {
                return NotFound();
            }
            return Ok(book);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting book {BookId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Book>> CreateBook([FromBody] Book book)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdBook = await _bookService.CreateBookAsync(book);
            return CreatedAtAction(nameof(GetBook), new { id = createdBook.Id }, createdBook);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating book");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Book>> UpdateBook(string id, [FromBody] Book book)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedBook = await _bookService.UpdateBookAsync(id, book);
            if (updatedBook == null)
            {
                return NotFound();
            }

            return Ok(updatedBook);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating book {BookId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<Book>> PatchBook(string id, [FromBody] Dictionary<string, object> updates)
    {
        try
        {
            var book = await _bookService.PatchBookAsync(id, updates);
            if (book == null)
            {
                return NotFound();
            }

            return Ok(book);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error patching book {BookId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBook(string id)
    {
        try
        {
            var result = await _bookService.DeleteBookAsync(id);
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting book {BookId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Book>>> SearchBooks([FromQuery] string query)
    {
        try
        {
            var books = await _bookService.SearchBooksAsync(query);
            return Ok(books);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching books with query {Query}", query);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("{id}/generate-summary")]
    public async Task<ActionResult<object>> GenerateBookSummary(string id, CancellationToken cancellationToken)
    {
        try
        {
            var book = await _bookService.GetBookByIdAsync(id);
            if (book == null)
            {
                return NotFound(new { message = "Book not found" });
            }

            var summary = await _claudeService.GenerateBookSummaryAsync(book.Title, book.Author, book.Description, cancellationToken);

            return Ok(new
            {
                bookId = book.Id,
                title = book.Title,
                author = book.Author,
                aiGeneratedSummary = summary
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating summary for book {BookId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}