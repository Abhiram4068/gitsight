using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace GitSight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IWebhookService _webhookService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IWebhookService webhookService,
        ILogger<WebhooksController> logger)
    {
        _webhookService = webhookService;
        _logger = logger;
    }

    [HttpGet]
    [HttpGet("github")]
    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(ApiResponse<string>.SuccessResponse("GitSight Webhook service is active and listening.", "Healthy", 200));
    }

    [HttpPost]
    [HttpPost("github")]
    public async Task<IActionResult> HandleGitHubWebhook()
    {
        // Extract headers
        Request.Headers.TryGetValue("X-GitHub-Event", out var eventTypeHeader);
        Request.Headers.TryGetValue("X-GitHub-Delivery", out var deliveryIdHeader);
        Request.Headers.TryGetValue("User-Agent", out var userAgentHeader);
        Request.Headers.TryGetValue("X-Hub-Signature-256", out var signatureHeader);

        // Read request payload
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        // Controller input validation for GitHub webhook properties & origin authenticity
        var validationResult = _webhookService.ValidateWebhookRequest(
            eventTypeHeader.ToString(),
            deliveryIdHeader.ToString(),
            userAgentHeader.ToString(),
            signatureHeader.ToString(),
            body);

        if (!validationResult.IsValid)
        {
            _logger.LogWarning("GitHub webhook validation rejected: {ErrorMessage}", validationResult.ErrorMessage);
            return StatusCode(
                validationResult.StatusCode,
                ApiResponse<string>.FailureResponse(validationResult.ErrorMessage ?? "Invalid GitHub webhook request.", validationResult.StatusCode));
        }

        // Delegate logical validations and business processing to WebhookService
        var result = await _webhookService.ProcessGitHubWebhookAsync(
            eventTypeHeader.ToString(),
            body,
            HttpContext.RequestAborted);

        return Ok(ApiResponse<object>.SuccessResponse(
            result.Data ?? result.Message,
            result.Message,
            200));
    }
}
