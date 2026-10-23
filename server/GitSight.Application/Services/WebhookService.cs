using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GitSight.Application.Services;

public class WebhookService : IWebhookService
{
    private readonly IUserRepository _userRepository;
    private readonly IPullRequestService _pullRequestService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(
        IUserRepository userRepository,
        IPullRequestService pullRequestService,
        IConfiguration configuration,
        ILogger<WebhookService> logger)
    {
        _userRepository = userRepository;
        _pullRequestService = pullRequestService;
        _configuration = configuration;
        _logger = logger;
    }

    public GitHubWebhookValidationResult ValidateWebhookRequest(
        string? eventType,
        string? deliveryId,
        string? userAgent,
        string? signatureHeader,
        string payload)
    {
        if (string.IsNullOrWhiteSpace(eventType))
        {
            return GitHubWebhookValidationResult.Invalid("Missing 'X-GitHub-Event' header. Request does not appear to originate from GitHub.", 400);
        }

        if (string.IsNullOrWhiteSpace(deliveryId))
        {
            return GitHubWebhookValidationResult.Invalid("Missing 'X-GitHub-Delivery' header. Request does not appear to originate from GitHub.", 400);
        }

        if (string.IsNullOrWhiteSpace(userAgent) || !userAgent.Contains("GitHub-Hookshot", StringComparison.OrdinalIgnoreCase))
        {
            return GitHubWebhookValidationResult.Invalid("Invalid User-Agent header. Webhooks must originate from GitHub-Hookshot.", 400);
        }

        if (string.IsNullOrWhiteSpace(payload))
        {
            return GitHubWebhookValidationResult.Invalid("Request body cannot be empty.", 400);
        }

        var secret = _configuration["GitHubSettings:WebhookSecret"] ?? _configuration["GitHub:WebhookSecret"];
        if (!string.IsNullOrEmpty(secret))
        {
            if (string.IsNullOrWhiteSpace(signatureHeader))
            {
                return GitHubWebhookValidationResult.Invalid("Missing 'X-Hub-Signature-256' signature header.", 401);
            }

            if (!VerifySignature(payload, signatureHeader))
            {
                return GitHubWebhookValidationResult.Invalid("Invalid GitHub webhook signature.", 401);
            }
        }
        else if (!string.IsNullOrWhiteSpace(signatureHeader))
        {
            if (!signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase) || signatureHeader.Length < 10)
            {
                return GitHubWebhookValidationResult.Invalid("Malformed 'X-Hub-Signature-256' header format.", 400);
            }
        }

        return GitHubWebhookValidationResult.Valid();
    }

    public bool VerifySignature(string payload, string? signatureHeader)
    {
        var secret = _configuration["GitHubSettings:WebhookSecret"] ?? _configuration["GitHub:WebhookSecret"];
        if (string.IsNullOrEmpty(secret))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            return false;
        }

        try
        {
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);

            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(payloadBytes);
            var expectedSignature = "sha256=" + Convert.ToHexString(hashBytes).ToLowerInvariant();

            var providedBytes = Encoding.UTF8.GetBytes(signatureHeader);
            var expectedBytes = Encoding.UTF8.GetBytes(expectedSignature);

            return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while calculating GitHub webhook HMAC signature.");
            return false;
        }
    }

    public async Task<WebhookResultDto> ProcessGitHubWebhookAsync(
        string eventType,
        string payload,
        CancellationToken cancellationToken = default)
    {
        // Logical validation: GitHub ping setup event
        if (eventType.Equals("ping", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Received GitHub ping webhook event.");
            return WebhookResultDto.Success("GitHub ping event received successfully.", "Ping received.");
        }

        // Logical validation: Only process pull_request events
        if (!eventType.Equals("pull_request", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Ignored GitHub webhook event: {EventType}", eventType);
            return WebhookResultDto.Ignored("Ignored non-PR event.", "Event ignored.");
        }

        // Logical validation: Parse JSON payload
        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(payload);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse webhook JSON payload.");
            return WebhookResultDto.Skipped("Malformed JSON payload.", "Invalid JSON format.");
        }

        using (doc)
        {
            var root = doc.RootElement;

            // Logical validation: Check action property
            if (!root.TryGetProperty("action", out var actionElement) || string.IsNullOrWhiteSpace(actionElement.GetString()))
            {
                _logger.LogWarning("Webhook payload missing 'action' property.");
                return WebhookResultDto.Skipped("Missing 'action' property in webhook payload.", "Action missing.");
            }

            var action = actionElement.GetString()!;
            if (action != "opened" && action != "synchronize" && action != "reopened")
            {
                _logger.LogInformation("Ignored pull request action '{Action}'.", action);
                return WebhookResultDto.Ignored($"Ignored action '{action}'.", "Action ignored.");
            }

            // Logical validation: Check pull_request object and PR number
            if (!root.TryGetProperty("pull_request", out var prElement) || prElement.ValueKind != JsonValueKind.Object)
            {
                _logger.LogWarning("Webhook payload missing 'pull_request' object.");
                return WebhookResultDto.Skipped("Missing 'pull_request' object in webhook payload.", "Pull request missing.");
            }

            if (!prElement.TryGetProperty("number", out var prNumberElement) || !prNumberElement.TryGetInt32(out var prNumber) || prNumber <= 0)
            {
                _logger.LogWarning("Webhook payload missing or invalid 'pull_request.number'.");
                return WebhookResultDto.Skipped("Invalid or missing PR number in webhook payload.", "PR number invalid.");
            }

            // Logical validation: Check repository object, name, and owner
            if (!root.TryGetProperty("repository", out var repoElement) || repoElement.ValueKind != JsonValueKind.Object)
            {
                _logger.LogWarning("Webhook payload missing 'repository' object.");
                return WebhookResultDto.Skipped("Missing 'repository' object in webhook payload.", "Repository missing.");
            }

            var repoName = repoElement.TryGetProperty("name", out var repoNameElement) ? repoNameElement.GetString() : null;
            var owner = repoElement.TryGetProperty("owner", out var ownerElement) && ownerElement.TryGetProperty("login", out var ownerLoginElement)
                ? ownerLoginElement.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(repoName) || string.IsNullOrWhiteSpace(owner))
            {
                _logger.LogWarning("Webhook payload missing repository name or owner login.");
                return WebhookResultDto.Skipped("Repository name or owner is missing in webhook payload.", "Repository details missing.");
            }

            _logger.LogInformation("Processing PR #{PrNumber} for {Owner}/{RepoName} via Webhook", prNumber, owner, repoName);

            // Clean Architecture: Retrieve active user via repository without touching DB context
            var user = await _userRepository.GetActiveUserForWebhookAsync(owner, cancellationToken);
            if (user is null || string.IsNullOrEmpty(user.AccessToken))
            {
                _logger.LogWarning("No user token found to process webhook for {Owner}/{RepoName}.", owner, repoName);
                return WebhookResultDto.Skipped("Repository not actively tracked.", "Repository skipped.");
            }

            // Delegate PR analysis and email notifications to the service layer
            var session = await _pullRequestService.AnalyzePullRequestAsync(
                user.AccessToken,
                owner,
                repoName,
                prNumber,
                user.Email,
                isWebhook: true);

            var responseData = new
            {
                owner,
                repo = repoName,
                prNumber,
                summary = session.ExecutiveSummary,
                commentsGenerated = session.Issues.Count
            };

            return WebhookResultDto.Success(responseData, "PR successfully reviewed by GitSight Agent.");
        }
    }
}
