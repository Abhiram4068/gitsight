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
    private readonly IGitHubService _gitHubService;
    private readonly IAiReviewService _geminiService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IApplicationDbContext context,
        IGitHubService gitHubService,
        IAiReviewService geminiService,
        ILogger<WebhooksController> logger)
    {
        _context = context;
        _gitHubService = gitHubService;
        _geminiService = geminiService;
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

        _logger.LogInformation("Processing PR #{PrNumber} for {Owner}/{RepoName}", prNumber, owner, repoName);

        // Find tracking repository & associated user token
        var repo = await _context.Repositories
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.GitHubRepoId == repoId);

        if (repo is null || string.IsNullOrEmpty(repo.User?.AccessToken))
        {
            _logger.LogWarning("Repository {Owner}/{RepoName} is not tracked or has no linked user token.", owner, repoName);
            return Ok(ApiResponse<string>.SuccessResponse("Repository not actively tracked.", "Repository skipped.", 200));
        }

        // 1. Fetch diff from GitHub
        var diff = await _gitHubService.GetPullRequestDiffAsync(repo.User.AccessToken, owner, repoName, prNumber);

        // 2. Analyze diff using Gemini
        var aiResult = await _geminiService.AnalyzeDiffAsync(diff, prTitle, prBody);

        // 3. Save or update PrInsight
        var fullRepoName = $"{owner}/{repoName}";
        var insight = await _context.PrInsights
            .Include(p => p.Comments)
            .FirstOrDefaultAsync(p => p.RepositoryFullName == fullRepoName && p.PrNumber == prNumber);

        if (insight is null)
        {
            insight = new PrInsight
            {
                RepositoryFullName = fullRepoName,
                PrNumber = prNumber,
                AiSummary = aiResult.ExecutiveSummary,
                RiskLevel = aiResult.OverallConfidenceScore > 0.8m ? "Low" : "High",
                Status = PrInsightStatus.Analyzed
            };
            _context.PrInsights.Add(insight);
        }
        else
        {
            insight.AiSummary = aiResult.ExecutiveSummary;
            insight.RiskLevel = aiResult.OverallConfidenceScore > 0.8m ? "Low" : "High";
            insight.UpdatedAt = DateTime.UtcNow;
            insight.Status = PrInsightStatus.Analyzed;

            // Clear previous draft comments
            _context.ReviewComments.RemoveRange(insight.Comments.Where(c => !c.IsPostedToGitHub));
        }

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
