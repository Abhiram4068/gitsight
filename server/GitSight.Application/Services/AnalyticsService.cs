using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GitSight.Application.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IApplicationDbContext _context;
    private readonly IGitHubService _gitHubService;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(
        IApplicationDbContext context,
        IGitHubService gitHubService,
        ILogger<AnalyticsService> logger)
    {
        _context = context;
        _gitHubService = gitHubService;
        _logger = logger;
    }

    public async Task<ApiResponse<DashboardAnalyticsDto>> GetDashboardAnalyticsAsync(string? token, Guid? userId)
    {
        _logger.LogInformation("Generating dashboard analytics. UserId: {UserId}", userId);

        var dto = new DashboardAnalyticsDto();

        // 1. AI Review Agent Metrics
        dto.TotalAiReviews = await _context.AiReviewSessions.CountAsync();
        dto.TotalAiIssues = await _context.AiReviewIssues.CountAsync();

        var sessionsWithConfidence = await _context.AiReviewSessions
            .Where(s => s.OverallConfidenceScore > 0)
            .Select(s => (double)s.OverallConfidenceScore)
            .ToListAsync();

        if (sessionsWithConfidence.Any())
        {
            dto.AverageConfidenceScore = Math.Round((decimal)sessionsWithConfidence.Average(), 1);
        }

        // 2. Total Tracked PRs
        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            var userTrackedCount = await _context.TrackedIssues
                .Where(t => t.TrackedByUserId == userId.Value)
                .Select(t => t.PullRequestNumber)
                .Distinct()
                .CountAsync();

            dto.TotalTrackedPrs = userTrackedCount > 0 
                ? userTrackedCount 
                : await _context.AiReviewSessions.CountAsync(s => s.IsTracked);
        }
        else
        {
            dto.TotalTrackedPrs = await _context.AiReviewSessions.CountAsync(s => s.IsTracked);
        }

        // 3. Repositories & Recent Pull Requests via GitHub API or DB
        var recentPrs = new List<PullRequestDto>();
        int totalPrs = 0;
        int totalRepos = 0;

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var userRepos = await _gitHubService.GetUserRepositoriesAsync(token);
                totalRepos = userRepos.Count;

                // Query pull requests across active repos (top 3 repos to stay fast)
                var topRepos = userRepos.Take(3).ToList();
                var prTasks = topRepos.Select(async repo =>
                {
                    try
                    {
                        var prs = await _gitHubService.GetPullRequestsAsync(token, repo.Owner, repo.Name, "all");
                        foreach (var p in prs)
                        {
                            p.GitHubRepoId = repo.GitHubRepoId;
                            if (repo.Id != Guid.Empty) p.RepositoryId = repo.Id;
                        }
                        return prs;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to fetch PRs for repository {Repo}", repo.FullName);
                        return new List<PullRequestDto>();
                    }
                });

                var prResults = await Task.WhenAll(prTasks);
                var allPrs = prResults.SelectMany(p => p).ToList();

                totalPrs = allPrs.Count;

                // Load existing review sessions to enrich PR metadata
                var sessions = await _context.AiReviewSessions
                    .Include(s => s.Issues)
                    .OrderByDescending(s => s.CreatedAt)
                    .Take(50)
                    .ToListAsync();

                foreach (var pr in allPrs)
                {
                    var matchedSession = sessions.FirstOrDefault(s => s.PrNumber == pr.PrNumber);
                    if (matchedSession != null)
                    {
                        pr.AnalysisStatus = "completed";
                        pr.IsTracked = matchedSession.IsTracked;
                        pr.AiCommentsCount = matchedSession.Issues.Count;
                        pr.AiSummary = matchedSession.ExecutiveSummary;
                        pr.RiskLevel = matchedSession.SecurityIssuesCount > 0 ? "High" : (matchedSession.CodeSmellsCount > 0 ? "Medium" : "Low");
                    }
                }

                recentPrs = allPrs
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(6)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load live GitHub repositories/PRs for dashboard analytics. Falling back to DB.");
            }
        }

        // Fallbacks if GitHub token is empty or errored
        if (totalRepos == 0)
        {
            totalRepos = await _context.PrInsights.Select(p => p.RepositoryFullName).Distinct().CountAsync();
        }

        if (totalPrs == 0)
        {
            totalPrs = await _context.PrInsights.CountAsync();
        }

        dto.TotalRepos = totalRepos;
        dto.TotalPrs = totalPrs;
        dto.RecentPrs = recentPrs;

        return ApiResponse<DashboardAnalyticsDto>.SuccessResponse(dto, "Dashboard analytics fetched successfully.");
    }
}
