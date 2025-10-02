using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace BookStore.Service.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ErrorTestController : ControllerBase
{
    private static readonly ActivitySource Activity = new("BookStore.Service");
    private readonly ILogger<ErrorTestController> _logger;

    public ErrorTestController(ILogger<ErrorTestController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Returns 400 Bad Request
    /// </summary>
    [HttpGet("400")]
    public IActionResult BadRequest()
    {
        using var activity = Activity.StartActivity("ErrorTest.BadRequest");
        _logger.LogWarning("Test endpoint returning 400 Bad Request");
        return BadRequest(new { error = "Bad Request", message = "The request was malformed or invalid" });
    }

    /// <summary>
    /// Returns 401 Unauthorized
    /// </summary>
    [HttpGet("401")]
    public IActionResult Unauthorized()
    {
        using var activity = Activity.StartActivity("ErrorTest.Unauthorized");
        _logger.LogWarning("Test endpoint returning 401 Unauthorized");
        return Unauthorized(new { error = "Unauthorized", message = "Authentication is required" });
    }

    /// <summary>
    /// Returns 403 Forbidden
    /// </summary>
    [HttpGet("403")]
    public IActionResult Forbidden()
    {
        using var activity = Activity.StartActivity("ErrorTest.Forbidden");
        _logger.LogWarning("Test endpoint returning 403 Forbidden");
        return StatusCode(403, new { error = "Forbidden", message = "You don't have permission to access this resource" });
    }

    /// <summary>
    /// Returns 404 Not Found
    /// </summary>
    [HttpGet("404")]
    public IActionResult NotFound()
    {
        using var activity = Activity.StartActivity("ErrorTest.NotFound");
        _logger.LogWarning("Test endpoint returning 404 Not Found");
        return NotFound(new { error = "Not Found", message = "The requested resource does not exist" });
    }

    /// <summary>
    /// Returns 405 Method Not Allowed
    /// </summary>
    [HttpGet("405")]
    public IActionResult MethodNotAllowed()
    {
        using var activity = Activity.StartActivity("ErrorTest.MethodNotAllowed");
        _logger.LogWarning("Test endpoint returning 405 Method Not Allowed");
        return StatusCode(405, new { error = "Method Not Allowed", message = "The HTTP method is not supported for this resource" });
    }

    /// <summary>
    /// Returns 409 Conflict
    /// </summary>
    [HttpGet("409")]
    public IActionResult Conflict()
    {
        using var activity = Activity.StartActivity("ErrorTest.Conflict");
        _logger.LogWarning("Test endpoint returning 409 Conflict");
        return Conflict(new { error = "Conflict", message = "The request conflicts with the current state of the resource" });
    }

    /// <summary>
    /// Returns 410 Gone
    /// </summary>
    [HttpGet("410")]
    public IActionResult Gone()
    {
        using var activity = Activity.StartActivity("ErrorTest.Gone");
        _logger.LogWarning("Test endpoint returning 410 Gone");
        return StatusCode(410, new { error = "Gone", message = "The resource is no longer available and will not be available again" });
    }

    /// <summary>
    /// Returns 415 Unsupported Media Type
    /// </summary>
    [HttpGet("415")]
    public IActionResult UnsupportedMediaType()
    {
        using var activity = Activity.StartActivity("ErrorTest.UnsupportedMediaType");
        _logger.LogWarning("Test endpoint returning 415 Unsupported Media Type");
        return StatusCode(415, new { error = "Unsupported Media Type", message = "The request entity has a media type which the server does not support" });
    }

    /// <summary>
    /// Returns 422 Unprocessable Entity
    /// </summary>
    [HttpGet("422")]
    public IActionResult UnprocessableEntity()
    {
        using var activity = Activity.StartActivity("ErrorTest.UnprocessableEntity");
        _logger.LogWarning("Test endpoint returning 422 Unprocessable Entity");
        return UnprocessableEntity(new { error = "Unprocessable Entity", message = "The request was well-formed but contains semantic errors" });
    }

    /// <summary>
    /// Returns 429 Too Many Requests
    /// </summary>
    [HttpGet("429")]
    public IActionResult TooManyRequests()
    {
        using var activity = Activity.StartActivity("ErrorTest.TooManyRequests");
        _logger.LogWarning("Test endpoint returning 429 Too Many Requests");
        return StatusCode(429, new { error = "Too Many Requests", message = "You have sent too many requests in a given amount of time" });
    }

    /// <summary>
    /// Returns 500 Internal Server Error
    /// </summary>
    [HttpGet("500")]
    public IActionResult InternalServerError()
    {
        using var activity = Activity.StartActivity("ErrorTest.InternalServerError");
        _logger.LogError("Test endpoint returning 500 Internal Server Error");
        return StatusCode(500, new { error = "Internal Server Error", message = "An unexpected error occurred on the server" });
    }

    /// <summary>
    /// Returns 502 Bad Gateway
    /// </summary>
    [HttpGet("502")]
    public IActionResult BadGateway()
    {
        using var activity = Activity.StartActivity("ErrorTest.BadGateway");
        _logger.LogError("Test endpoint returning 502 Bad Gateway");
        return StatusCode(502, new { error = "Bad Gateway", message = "The server received an invalid response from the upstream server" });
    }

    /// <summary>
    /// Returns 503 Service Unavailable
    /// </summary>
    [HttpGet("503")]
    public IActionResult ServiceUnavailable()
    {
        using var activity = Activity.StartActivity("ErrorTest.ServiceUnavailable");
        _logger.LogError("Test endpoint returning 503 Service Unavailable");
        return StatusCode(503, new { error = "Service Unavailable", message = "The service is temporarily unavailable" });
    }

    /// <summary>
    /// Returns 504 Gateway Timeout
    /// </summary>
    [HttpGet("504")]
    public IActionResult GatewayTimeout()
    {
        using var activity = Activity.StartActivity("ErrorTest.GatewayTimeout");
        _logger.LogError("Test endpoint returning 504 Gateway Timeout");
        return StatusCode(504, new { error = "Gateway Timeout", message = "The server did not receive a timely response from the upstream server" });
    }

    /// <summary>
    /// Returns a random error status code
    /// </summary>
    [HttpGet("random")]
    public IActionResult RandomError()
    {
        using var activity = Activity.StartActivity("ErrorTest.Random");

        var statusCodes = new[] { 400, 401, 403, 404, 405, 409, 410, 415, 422, 429, 500, 502, 503, 504 };
        var randomIndex = Random.Shared.Next(statusCodes.Length);
        var statusCode = statusCodes[randomIndex];

        _logger.LogWarning("Test endpoint returning random error: {StatusCode}", statusCode);

        return StatusCode(statusCode, new
        {
            error = $"Random Error {statusCode}",
            message = $"This is a randomly selected error status code: {statusCode}"
        });
    }
}
