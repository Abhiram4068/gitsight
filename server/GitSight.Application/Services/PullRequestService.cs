using GitSight.Application.Common.DTOs;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using GitSight.Domain.Entities;
using GitSight.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GitSight.Application.Services;

public class PullRequestService : IPullRequestService
{
    private readonly IPullRequestRepository _repository;
    private readonly IGitHubService _gitHubService;
    private readonly IAiReviewService _geminiService;
    private readonly ILogger<PullRequestService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public PullRequestService(
        IPullRequestRepository repository,
        IGitHubService gitHubService,
        IAiReviewService geminiService,
        ILogger<PullRequestService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _repository = repository;
        _gitHubService = gitHubService;
        _geminiService = geminiService;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task<PaginatedResponseDto<PullRequestDto>> GetPullRequestsAsync(
        string token, string? owner, string? repo, string? repoFullName, Guid? repositoryId, string state, string? search, int pageNumber, int pageSize)
    {
        _logger.LogInformation("GetPullRequestsAsync called for owner: {Owner}, repo: {Repo}, state: {State}, search: {Search}, page: {PageNumber}", 
            owner, repo, state, search, pageNumber);

        string targetOwner = owner ?? string.Empty;
        string targetRepo = repo ?? string.Empty;

        if (repositoryId.HasValue && (string.IsNullOrEmpty(targetOwner) || string.IsNullOrEmpty(targetRepo)))
        {
            var dbRepo = await _repository.GetRepositoryByIdAsync(repositoryId.Value);
            if (dbRepo is not null)
            {
                targetOwner = dbRepo.Owner;
                targetRepo = dbRepo.Name;
            }
        }

        if (!string.IsNullOrEmpty(repoFullName) && (string.IsNullOrEmpty(targetOwner) || string.IsNullOrEmpty(targetRepo)))
        {
            var parts = repoFullName.Split('/');
            if (parts.Length == 2)
            {
                targetOwner = parts[0];
                targetRepo = parts[1];
            }
        }

        List<PullRequestDto> pullRequests = new();

        if (string.IsNullOrEmpty(targetOwner) || string.IsNullOrEmpty(targetRepo))
        {
            if (!string.IsNullOrEmpty(token))
            {
                var userRepos = await _gitHubService.GetUserRepositoriesAsync(token);
                if (userRepos.Count > 0)
                {
                    targetOwner = userRepos[0].Owner;
                    targetRepo = userRepos[0].Name;
                }
            }
        }

        if (!string.IsNullOrEmpty(token) && !string.IsNullOrEmpty(targetOwner) && !string.IsNullOrEmpty(targetRepo))
        {
            try
            {
                pullRequests = await _gitHubService.GetPullRequestsAsync(token, targetOwner, targetRepo, state);
            }
            catch (Exception ex)
            {
                pullRequests = new List<PullRequestDto>();
            }
        }

        var fullRepoName = $"{targetOwner}/{targetRepo}";
        var insights = await _repository.GetInsightsByRepoAsync(fullRepoName);

        foreach (var pr in pullRequests)
        {
            var insight = insights.FirstOrDefault(l => l.PrNumber == pr.PrNumber);
            if (insight is not null)
            {
                pr.Id = insight.Id;
                pr.AiSummary = insight.AiSummary;
                pr.RiskLevel = insight.RiskLevel;
                pr.AnalysisStatus = insight.Status.ToString().ToLower();
            }
        }

        var query = pullRequests.AsQueryable();

        if (!string.IsNullOrEmpty(state) && !string.Equals(state, "all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => string.Equals(p.State, state, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                p.Author.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                p.HeadBranch.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                p.PrNumber.ToString().Contains(search));
        }

        var totalCount = query.Count();
        var items = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        var fetchStatsTasks = items.Select(async item =>
        {
            if (!string.IsNullOrEmpty(token))
            {
                var stats = await _gitHubService.GetPullRequestStatsAsync(token, targetOwner, targetRepo, item.PrNumber);
                item.Additions = stats.Additions;
                item.Deletions = stats.Deletions;
                item.ChangedFiles = stats.ChangedFiles;
            }
        });

        await Task.WhenAll(fetchStatsTasks);

        return new PaginatedResponseDto<PullRequestDto>(items, totalCount, pageNumber, pageSize);
    }

    public async Task<PrDiffResponseDto?> GetPrDiffAsync(string token, Guid id)
    {
        _logger.LogInformation("GetPrDiffAsync called for PR Insight ID: {Id}", id);
        var insight = await _repository.GetInsightByIdAsync(id, includeComments: true);
        if (insight is null)
        {
            _logger.LogWarning("No PR Insight found for ID: {Id}", id);
            return null;
        }

        var parts = insight.RepositoryFullName.Split('/');
        var owner = parts[0];
        var repo = parts[1];
        
        var githubPr = await _gitHubService.GetPullRequestStatsAsync(token, owner, repo, insight.PrNumber);
        var diffContent = await _gitHubService.GetPullRequestDiffAsync(token, owner, repo, insight.PrNumber);

        return new PrDiffResponseDto
        {
            PullRequestId = insight.Id,
            PrNumber = insight.PrNumber,
            PrTitle = githubPr.Title,
            Description = githubPr.Description,
            RepositoryFullName = insight.RepositoryFullName,
            DiffContent = diffContent ?? string.Empty,
            AiSummary = insight.AiSummary,
            RiskLevel = insight.RiskLevel,
            Comments = insight.Comments.Select(c => new ReviewCommentDto
            {
                Id = c.Id,
                FilePath = c.FilePath,
                LineNumber = c.LineNumber,
                Side = c.Side,
                Comment = c.Comment,
                SuggestedCode = c.SuggestedCode,
                Severity = c.Severity.ToString(),
                IsAiGenerated = c.IsAiGenerated,
                IsPostedToGitHub = c.IsPostedToGitHub
            }).ToList()
        };
    }

    public async Task<List<PullRequestFileDto>> GetPullRequestFilesAsync(string token, string owner, string repo, int prNumber)
    {
        _logger.LogInformation("GetPullRequestFilesAsync called for owner={Owner}, repo={Repo}, prNumber={PrNumber}", owner, repo, prNumber);
        return await _gitHubService.GetPullRequestFilesAsync(token, owner, repo, prNumber);
    }

    public async Task<PullRequestDto> GetPullRequestStatsAsync(string token, string owner, string repo, int prNumber)
    {
        _logger.LogInformation("GetPullRequestStatsAsync called for owner={Owner}, repo={Repo}, prNumber={PrNumber}", owner, repo, prNumber);
        return await _gitHubService.GetPullRequestStatsAsync(token, owner, repo, prNumber);
    }

    public async Task<AiReviewSession?> GetPullRequestInsightsAsync(string owner, string repo, int prNumber)
    {
        _logger.LogInformation("GetPullRequestInsightsAsync called for owner={Owner}, repo={Repo}, prNumber={PrNumber}", owner, repo, prNumber);
        return await _repository.GetAiReviewSessionAsync(owner, repo, prNumber, includeIssues: true);
    }

    public async Task<AiReviewSession> AnalyzePullRequestAsync(string token, string owner, string repo, int prNumber)
    {
        _logger.LogInformation("Starting AI analysis for PR #{PrNumber} in {Owner}/{Repo}", prNumber, owner, repo);
        var existingSession = await _repository.GetAiReviewSessionAsync(owner, repo, prNumber, includeIssues: true);
        if (existingSession != null)
        {
            _logger.LogInformation("Returning existing AI analysis session for PR #{PrNumber}", prNumber);
            
            // Self-healing: if the session exists but the insight was stuck in Analyzing due to a previous crash, fix it.
            var existingInsight = await _repository.GetInsightByPrNumberAsync($"{owner}/{repo}", prNumber, includeComments: false);
            if (existingInsight != null && existingInsight.Status != PrInsightStatus.Analyzed)
            {
                var riskLevel = existingSession.SecurityIssuesCount > 0 ? "High" : (existingSession.CodeSmellsCount > 0 ? "Medium" : "Low");
                await _repository.SaveAnalysisResultsAsync(existingInsight.Id, existingSession.ExecutiveSummary, riskLevel, new List<ReviewComment>());
            }
            
            return existingSession;
        }

        var diff = await _gitHubService.GetPullRequestDiffAsync(token, owner, repo, prNumber);
        if (string.IsNullOrEmpty(diff))
        {
            _logger.LogWarning("Diff for PR #{PrNumber} is empty or failed to fetch.", prNumber);
            throw new InvalidOperationException("Failed to fetch PR diff from GitHub, or diff is empty.");
        }

        var prDetails = await _gitHubService.GetPullRequestStatsAsync(token, owner, repo, prNumber);

        var fullRepoName = $"{owner}/{repo}";
        var insight = await _repository.GetInsightByPrNumberAsync(fullRepoName, prNumber, includeComments: true);
        
        if (insight != null && insight.Status == PrInsightStatus.Analyzing)
        {
            var timeSinceUpdate = DateTime.UtcNow - (insight.UpdatedAt ?? insight.CreatedAt);
            if (timeSinceUpdate.TotalMinutes < 5)
            {
                _logger.LogWarning("Analysis is already in progress for PR #{PrNumber}.", prNumber);
                throw new InvalidOperationException("Analysis is already in progress for this PR.");
            }
            else
            {
                _logger.LogInformation("Analysis for PR #{PrNumber} seems stuck in 'Analyzing' state. Allowing retry.", prNumber);
            }
        }

        if (insight == null)
        {
            insight = new PrInsight
            {
                RepositoryFullName = fullRepoName,
                PrNumber = prNumber,
                Status = PrInsightStatus.Analyzing,
                UpdatedAt = DateTime.UtcNow
            };
            await _repository.AddPrInsightAsync(insight);
            
            try
            {
                await _repository.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                _logger.LogWarning("Concurrent request detected while starting analysis for PR #{PrNumber}", prNumber);
                throw new InvalidOperationException("Analysis is already in progress for this PR.");
            }
        }
        else
        {
            insight.Status = PrInsightStatus.Analyzing;
            insight.UpdatedAt = DateTime.UtcNow;
            await _repository.SaveChangesAsync();
        }

        _logger.LogInformation("Calling Gemini AI Service for PR #{PrNumber} with Diff length: {DiffLength}", prNumber, diff.Length);
        var analysisDto = await _geminiService.AnalyzeDiffAsync(diff, prDetails.Title, prDetails.Description);
        
        if (analysisDto == null || string.IsNullOrEmpty(analysisDto.ExecutiveSummary))
        {
            _logger.LogError("Gemini AI analysis returned null or empty summary for PR #{PrNumber}", prNumber);
            insight.Status = PrInsightStatus.Failed;
            await _repository.SaveChangesAsync();
            throw new InvalidOperationException("Failed to generate AI review.");
        }

        _logger.LogInformation("Gemini AI analysis successfully completed for PR #{PrNumber}. Extracted {IssueCount} issues.", prNumber, analysisDto.Issues.Count);

        var session = new AiReviewSession
        {
            Owner = owner,
            Repo = repo,
            PrNumber = prNumber,
            ExecutiveSummary = analysisDto.ExecutiveSummary,
            OverallConfidenceScore = analysisDto.OverallConfidenceScore,
            FinalSuggestionsCount = analysisDto.FinalSuggestionsCount,
            SecurityIssuesCount = analysisDto.SecurityIssuesCount,
            SyntaxErrorsCount = analysisDto.SyntaxErrorsCount,
            BreachesCount = analysisDto.BreachesCount,
            PerformanceIssuesCount = analysisDto.PerformanceIssuesCount,
            CodeSmellsCount = analysisDto.CodeSmellsCount,
            TestCoverageImpact = analysisDto.TestCoverageImpact,
            CodeComplexity = analysisDto.CodeComplexity,
            Issues = analysisDto.Issues.Select(i => new AiReviewIssue
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

        using var scope = _scopeFactory.CreateScope();
        var freshRepo = scope.ServiceProvider.GetRequiredService<IPullRequestRepository>();
        
        await freshRepo.AddAiReviewSessionAsync(session);
        await freshRepo.SaveChangesAsync();

        var freshInsight = await freshRepo.GetInsightByPrNumberAsync(fullRepoName, prNumber, includeComments: false);
        if (freshInsight != null)
        {
            var riskLevel = session.SecurityIssuesCount > 0 ? "High" : (session.CodeSmellsCount > 0 ? "Medium" : "Low");
            var comments = analysisDto.Issues.Select(i => new ReviewComment
            {
                FilePath = i.FilePath,
                LineNumber = i.StartLine,
                Comment = i.Comment,
                SuggestedCode = i.SuggestedAddedCode ?? i.SuggestedRemovedCode,
                Severity = Enum.TryParse<ReviewSeverity>(i.Severity, true, out var sev) ? sev : ReviewSeverity.Info,
                IsAiGenerated = true
            }).ToList();

            await freshRepo.SaveAnalysisResultsAsync(freshInsight.Id, session.ExecutiveSummary, riskLevel, comments);
        }

        return session;
    }

    public async Task<bool> MergePullRequestAsync(string token, MergePrRequestDto request)
    {
        _logger.LogInformation("MergePullRequestAsync called for PR #{PrNumber} in Repo ID: {RepoId} with strategy: {Strategy}", 
            request.PullRequestNumber, request.RepositoryId, request.MergeStrategy);

        var repo = await _repository.GetRepositoryByIdAsync(request.RepositoryId);
        if (repo is null)
        {
            _logger.LogWarning("Repository ID {RepoId} not found during merge.", request.RepositoryId);
            throw new KeyNotFoundException("Repository not found.");
        }

        var success = await _gitHubService.MergePullRequestAsync(
            token,
            repo.Owner,
            repo.Name,
            request.PullRequestNumber,
            request.MergeStrategy,
            request.CommitTitle
        );

        if (success)
        {
            var fullRepoName = $"{repo.Owner}/{repo.Name}";
            var insight = await _repository.GetInsightByPrNumberAsync(fullRepoName, request.PullRequestNumber);
            if (insight is not null)
            {
                insight.Status = PrInsightStatus.Closed;
                insight.UpdatedAt = DateTime.UtcNow;
                await _repository.SaveChangesAsync();
            }
        }

        return success;
    }

    public async Task<bool> PostReviewToGitHubAsync(string token, Guid id, PostReviewCommentsRequestDto request)
    {
        _logger.LogInformation("PostReviewToGitHubAsync called for PR Insight ID: {Id}", id);
        var insight = await _repository.GetInsightByIdAsync(id, includeComments: true);
        if (insight is null)
        {
            _logger.LogWarning("No PR Insight found for ID: {Id} during PostReview.", id);
            throw new KeyNotFoundException("Pull request insight not found.");
        }

        var parts = insight.RepositoryFullName.Split('/');
        var owner = parts[0];
        var repo = parts[1];
        var githubPr = await _gitHubService.GetPullRequestStatsAsync(token, owner, repo, insight.PrNumber);

        var unpostedComments = insight.Comments.Where(c => !c.IsPostedToGitHub).Select(c => new ReviewCommentDto
        {
            Id = c.Id,
            FilePath = c.FilePath,
            LineNumber = c.LineNumber,
            Side = c.Side,
            Comment = c.Comment,
            SuggestedCode = c.SuggestedCode
        }).ToList();

        var body = request.ReviewSummary ?? insight.AiSummary ?? "GitSight Automated Code Review";

        var posted = await _gitHubService.PostPullRequestReviewAsync(
            token,
            owner,
            repo,
            insight.PrNumber,
            githubPr.HeadSha,
            body,
            unpostedComments,
            request.Event
        );

        if (posted)
        {
            foreach (var comment in insight.Comments.Where(c => !c.IsPostedToGitHub))
            {
                comment.IsPostedToGitHub = true;
            }
            await _repository.SaveChangesAsync();
        }

        return posted;
    }
}
