using GitSight.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace GitSight.Application.Services;

public class WebhookService : IWebhookService
{
    private readonly IWebhookRepository _webhookRepository;
    private readonly IPullRequestService _pullRequestService;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(
        IWebhookRepository webhookRepository,
        IPullRequestService pullRequestService,
        ILogger<WebhookService> logger)
    {
        _webhookRepository = webhookRepository;
        _pullRequestService = pullRequestService;
        _logger = logger;
    }

    public async Task ProcessPullRequestWebhookAsync(long ownerId, string owner, string repoName, int prNumber)
    {
        var token = await _webhookRepository.GetAccessTokenForOwnerIdAsync(ownerId);

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("Owner {Owner} (ID: {OwnerId}) is not registered in GitSight. Webhook ignored for {RepoName}.", owner, ownerId, repoName);
            return;
        }

        _logger.LogInformation("Webhook triggered AI analysis for PR #{PrNumber} in {Owner}/{RepoName}", prNumber, owner, repoName);

        // Delegate to the shared Pull Request service.
        await _pullRequestService.AnalyzePullRequestAsync(token, owner, repoName, prNumber);
    }
}
