using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IWebhookService
{
    /// <summary>
    /// Validates incoming webhook request headers and payload to verify authenticity from GitHub.
    /// </summary>
    GitHubWebhookValidationResult ValidateWebhookRequest(
        string? eventType,
        string? deliveryId,
        string? userAgent,
        string? signatureHeader,
        string payload);

    /// <summary>
    /// Verifies HMAC-SHA256 signature against configured GitHub webhook secret.
    /// </summary>
    bool VerifySignature(string payload, string? signatureHeader);

    /// <summary>
    /// Performs business and logical-level validations and processes the GitHub webhook event.
    /// </summary>
    Task<WebhookResultDto> ProcessGitHubWebhookAsync(
        string eventType,
        string payload,
        CancellationToken cancellationToken = default);
}
