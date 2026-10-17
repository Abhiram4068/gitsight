using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Domain.Entities;
using GitSight.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IPullRequestService _pullRequestService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IApplicationDbContext context,
        IPullRequestService pullRequestService,
        ILogger<WebhooksController> logger)
    {
        _context = context;
        _pullRequestService = pullRequestService;
        _logger = logger;
    }

    [HttpPost("github")]
    public async Task<IActionResult> HandleGitHubWebhook()
    {
        Request.Headers.TryGetValue("X-GitHub-Event", out var eventType);

        if (eventType != "pull_request")
        {
            return Ok(ApiResponse<string>.SuccessResponse("Ignored non-PR event.", "Event ignored.", 200));
        }

        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        var action = root.GetProperty("action").GetString();
        if (action != "opened" && action != "synchronize" && action != "reopened")
        {
            return Ok(ApiResponse<string>.SuccessResponse($"Ignored action '{action}'.", "Action ignored.", 200));
        }

        var prElement = root.GetProperty("pull_request");
        var prNumber = prElement.GetProperty("number").GetInt32();
        var prTitle = prElement.GetProperty("title").GetString() ?? string.Empty;
        var prBody = prElement.TryGetProperty("body", out var b) ? b.GetString() : null;
        var headSha = prElement.GetProperty("head").GetProperty("sha").GetString() ?? string.Empty;
        var baseBranch = prElement.GetProperty("base").GetProperty("ref").GetString() ?? "main";
        var headBranch = prElement.GetProperty("head").GetProperty("ref").GetString() ?? string.Empty;

        var repoElement = root.GetProperty("repository");
        var repoId = repoElement.GetProperty("id").GetInt64();
        var repoName = repoElement.GetProperty("name").GetString()!;
        var owner = repoElement.GetProperty("owner").GetProperty("login").GetString()!;

        _logger.LogInformation("Processing PR #{PrNumber} for {Owner}/{RepoName} via Webhook", prNumber, owner, repoName);

        // Find tracking repository & associated user token
        var repo = await _context.Repositories
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.GitHubRepoId == repoId);

        if (repo is null || string.IsNullOrEmpty(repo.User?.AccessToken))
        {
            _logger.LogWarning("Repository {Owner}/{RepoName} is not tracked or has no linked user token.", owner, repoName);
            return Ok(ApiResponse<string>.SuccessResponse("Repository not actively tracked.", "Repository skipped.", 200));
        }

        // Delegate PR analysis and email notifications to the service layer
        var session = await _pullRequestService.AnalyzePullRequestAsync(
            repo.User.AccessToken,
            owner,
            repoName,
            prNumber,
            repo.User.Email,
            isWebhook: true);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            owner,
            repo = repoName,
            prNumber,
            summary = session.ExecutiveSummary,
            commentsGenerated = session.Issues.Count
        }, "PR successfully reviewed by GitSight Agent."));
    }
}
