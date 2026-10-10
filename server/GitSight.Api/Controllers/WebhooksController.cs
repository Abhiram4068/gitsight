using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Threading.Tasks;

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
        
        var repoElement = root.GetProperty("repository");
        var ownerElement = repoElement.GetProperty("owner");
        
        var ownerId = ownerElement.GetProperty("id").GetInt64();
        var repoName = repoElement.GetProperty("name").GetString()!;
        var owner = ownerElement.GetProperty("login").GetString()!;

        _logger.LogInformation("Webhook received PR #{PrNumber} for {Owner}/{RepoName}", prNumber, owner, repoName);

        // Process webhook using the dedicated service (looking up user by owner ID)
        await _webhookService.ProcessPullRequestWebhookAsync(ownerId, owner, repoName, prNumber);

        // 4. Add AI suggestions
        foreach (var comment in aiResult.Issues)
        {
            insight.Comments.Add(new ReviewComment
            {
                FilePath = comment.FilePath,
                LineNumber = comment.StartLine,
                Side = "RIGHT",
                Comment = comment.Comment,
                SuggestedCode = comment.SuggestedAddedCode,
                Severity = Enum.TryParse<ReviewSeverity>(comment.Severity, true, out var sev) ? sev : ReviewSeverity.Info,
                IsAiGenerated = true,
                IsPostedToGitHub = false
            });
        }
        
        // Save AiReviewSession to track detailed analytics
        var session = new AiReviewSession
        {
            Owner = owner,
            Repo = repoName,
            PrNumber = prNumber,
            ExecutiveSummary = aiResult.ExecutiveSummary,
            OverallConfidenceScore = aiResult.OverallConfidenceScore,
            FinalSuggestionsCount = aiResult.FinalSuggestionsCount,
            SecurityIssuesCount = aiResult.SecurityIssuesCount,
            SyntaxErrorsCount = aiResult.SyntaxErrorsCount,
            BreachesCount = aiResult.BreachesCount,
            PerformanceIssuesCount = aiResult.PerformanceIssuesCount,
            CodeSmellsCount = aiResult.CodeSmellsCount,
            TestCoverageImpact = aiResult.TestCoverageImpact,
            CodeComplexity = aiResult.CodeComplexity,
            IsWebhook = true,
            Issues = aiResult.Issues.Select(i => new AiReviewIssue
            {
                FilePath = i.FilePath,
                StartLine = i.StartLine,
                EndLine = i.EndLine,
                Comment = i.Comment,
                IssueType = i.IssueType,
                Severity = i.Severity,
                SuggestedRemovedCode = i.SuggestedRemovedCode,
                SuggestedAddedCode = i.SuggestedAddedCode
            }).ToList()
        };
        _context.AiReviewSessions.Add(session);

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            prInsightId = insight.Id,
            prNumber,
            summary = aiResult.ExecutiveSummary,
            commentsGenerated = aiResult.Issues.Count
        }, "PR successfully reviewed by GitSight Agent."));
    }
}
