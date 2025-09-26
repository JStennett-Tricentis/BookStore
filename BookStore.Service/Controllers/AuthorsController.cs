using BookStore.Common.Models;
using BookStore.Service.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookStore.Service.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public class AuthorsController : ControllerBase
{
    private readonly IAuthorService _authorService;
    private readonly ILogger<AuthorsController> _logger;

    public AuthorsController(IAuthorService authorService, ILogger<AuthorsController> logger)
    {
        _authorService = authorService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Author>>> GetAuthors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var authors = await _authorService.GetAuthorsAsync(page, pageSize);
            return Ok(authors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting authors");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Author>> GetAuthor(string id)
    {
        try
        {
            var author = await _authorService.GetAuthorByIdAsync(id);
            if (author == null)
            {
                return NotFound();
            }
            return Ok(author);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting author {AuthorId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Author>> CreateAuthor([FromBody] Author author)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdAuthor = await _authorService.CreateAuthorAsync(author);
            return CreatedAtAction(nameof(GetAuthor), new { id = createdAuthor.Id }, createdAuthor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating author");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Author>> UpdateAuthor(string id, [FromBody] Author author)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedAuthor = await _authorService.UpdateAuthorAsync(id, author);
            if (updatedAuthor == null)
            {
                return NotFound();
            }

            return Ok(updatedAuthor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating author {AuthorId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAuthor(string id)
    {
        try
        {
            var result = await _authorService.DeleteAuthorAsync(id);
            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting author {AuthorId}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}