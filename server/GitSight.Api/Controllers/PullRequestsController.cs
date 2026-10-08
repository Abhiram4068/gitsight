using FluentValidation;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.Common.DTOs;
using GitSight.Application.DTOs;
using GitSight.Domain.Entities;
using GitSight.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PullRequestsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IGitHubService _gitHubService;
    private readonly IGeminiService _geminiService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<MergePrRequestDto> _mergeValidator;

    public PullRequestsController(
        IApplicationDbContext context,
        IGitHubService gitHubService,
        IGeminiService geminiService,
        ICurrentUserService currentUserService,
        IValidator<MergePrRequestDto> mergeValidator)
    {
        _context = context;
        _gitHubService = gitHubService;
        _geminiService = geminiService;
        _currentUserService = currentUserService;
        _mergeValidator = mergeValidator;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponseDto<PullRequestDto>>>> GetPullRequests(
        [FromQuery] string? owner = null,
        [FromQuery] string? repo = null,
        [FromQuery] string? repoFullName = null,
        [FromQuery] Guid? repositoryId = null,
        [FromQuery] string state = "all", // "all", "open", "closed"
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        string targetOwner = owner ?? string.Empty;
        string targetRepo = repo ?? string.Empty;

        if (repositoryId.HasValue && (string.IsNullOrEmpty(targetOwner) || string.IsNullOrEmpty(targetRepo)))
        {
            var dbRepo = await _context.Repositories.FirstOrDefaultAsync(r => r.Id == repositoryId.Value);
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

        var token = _currentUserService.GitHubAccessToken;
        List<PullRequestDto> pullRequests = new();

        // If targetOwner and targetRepo are still empty, try resolving from user's repositories
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
                // Fall back to local DB if GitHub API fails
                pullRequests = new List<PullRequestDto>();
            }
        }

        // Fetch local DB pull requests for enrichment
        var fullRepoName = $"{targetOwner}/{targetRepo}";
        var localPrs = await _context.PullRequests
            .Include(p => p.Comments)
            .Where(p => p.Repository.FullName == fullRepoName || (p.Repository.Owner == targetOwner && p.Repository.Name == targetRepo))
            .ToListAsync();

        // Enrich GitHub PRs with local AI review data
        foreach (var pr in pullRequests)
        {
            var localPr = localPrs.FirstOrDefault(l => l.PrNumber == pr.PrNumber);
            if (localPr is not null)
            {
                pr.Id = localPr.Id;
                pr.AiSummary = localPr.AiSummary;
                pr.RiskLevel = localPr.RiskLevel;
                pr.AnalysisStatus = !string.IsNullOrEmpty(localPr.AiSummary) ? "completed" : "analyzing";
                pr.AiCommentsCount = localPr.Comments.Count(c => c.IsAiGenerated);
            }
        }

        // If GitHub returned empty (or rate limit / offline), fallback to local PRs
        if (pullRequests.Count == 0 && localPrs.Count > 0)
        {
            pullRequests = localPrs.Select(lp => new PullRequestDto
            {
                Id = lp.Id,
                PrNumber = lp.PrNumber,
                Title = lp.Title,
                Description = lp.Description,
                State = lp.State.ToString().ToLower(),
                IsMerged = lp.State == PrState.Merged,
                Author = "contributor",
                HeadBranch = lp.HeadBranch,
                BaseBranch = lp.BaseBranch,
                HeadSha = lp.HeadSha,
                RepositoryFullName = fullRepoName,
                HtmlUrl = $"https://github.com/{fullRepoName}/pull/{lp.PrNumber}",
                AiSummary = lp.AiSummary,
                RiskLevel = lp.RiskLevel,
                AnalysisStatus = !string.IsNullOrEmpty(lp.AiSummary) ? "completed" : "pending",
                AiCommentsCount = lp.Comments.Count(c => c.IsAiGenerated),
                CreatedAt = lp.CreatedAt,
                UpdatedAt = lp.UpdatedAt
            }).ToList();
        }

        var query = pullRequests.AsQueryable();

        // Filter by state if specified ("open", "closed", "all")
        if (!string.IsNullOrEmpty(state) && !string.Equals(state, "all", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => string.Equals(p.State, state, StringComparison.OrdinalIgnoreCase));
        }

        // Filter by search query
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

        // Fetch detailed stats for the paginated items concurrently
        var fetchStatsTasks = items.Select(async item =>
        {
            // Only fetch if it's a real GitHub PR (not a fallback item with 0 additions)
            if (!string.IsNullOrEmpty(token))
            {
                var stats = await _gitHubService.GetPullRequestStatsAsync(token, targetOwner, targetRepo, item.PrNumber);
                item.Additions = stats.Additions;
                item.Deletions = stats.Deletions;
                item.ChangedFiles = stats.ChangedFiles;
            }
        });

        await Task.WhenAll(fetchStatsTasks);

        var paginatedResult = new PaginatedResponseDto<PullRequestDto>(items, totalCount, pageNumber, pageSize);
        return Ok(ApiResponse<PaginatedResponseDto<PullRequestDto>>.SuccessResponse(paginatedResult, "Pull requests fetched successfully."));
    }

    [HttpGet("{id:guid}/diff")]
    public async Task<ActionResult<ApiResponse<PrDiffResponseDto>>> GetPrDiff(Guid id)
    {
        var pr = await _context.PullRequests
            .Include(p => p.Repository)
            .Include(p => p.Comments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pr is null)
        {
            return NotFound(ApiResponse<object>.FailureResponse("Pull request not found.", 404));
        }

        var diffDto = new PrDiffResponseDto
        {
            PullRequestId = pr.Id,
            PrNumber = pr.PrNumber,
            PrTitle = pr.Title,
            Description = pr.Description,
            RepositoryFullName = pr.Repository.FullName,
            DiffContent = pr.DiffContent ?? string.Empty,
            AiSummary = pr.AiSummary,
            RiskLevel = pr.RiskLevel,
            Comments = pr.Comments.Select(c => new ReviewCommentDto
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

        return Ok(ApiResponse<PrDiffResponseDto>.SuccessResponse(diffDto, "PR Diff fetched successfully."));
    }

    [HttpGet("{owner}/{repo}/{prNumber}/files")]
    public async Task<ActionResult<ApiResponse<List<PullRequestFileDto>>>> GetPullRequestFiles(string owner, string repo, int prNumber)
    {
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<List<PullRequestFileDto>>.FailureResponse("GitHub token missing.", 401));
        }

        var files = await _gitHubService.GetPullRequestFilesAsync(token, owner, repo, prNumber);
        
        return Ok(ApiResponse<List<PullRequestFileDto>>.SuccessResponse(files, "PR files fetched successfully."));
    }

    [HttpGet("{owner}/{repo}/{prNumber}/stats")]
    public async Task<ActionResult<ApiResponse<PullRequestDto>>> GetPullRequestStats(string owner, string repo, int prNumber)
    {
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<PullRequestDto>.FailureResponse("GitHub token missing.", 401));
        }

        var prDetails = await _gitHubService.GetPullRequestStatsAsync(token, owner, repo, prNumber);

        return Ok(ApiResponse<PullRequestDto>.SuccessResponse(prDetails, "PR details fetched successfully."));
    }

    [HttpPost("merge")]
    public async Task<ActionResult<ApiResponse<bool>>> MergePullRequest([FromBody] MergePrRequestDto request)
    {
        // FluentValidation check
        var validationResult = await _mergeValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<bool>.FailureResponse("Validation failed.", 400, errors));
        }

        var repo = await _context.Repositories.FirstOrDefaultAsync(r => r.Id == request.RepositoryId);
        if (repo is null)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Repository not found.", 404));
        }

        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<bool>.FailureResponse("GitHub access token not available in session.", 401));
        }

        var success = await _gitHubService.MergePullRequestAsync(
            token,
            repo.Owner,
            repo.Name,
            request.PullRequestNumber,
            request.MergeStrategy,
            request.CommitTitle
        );

        if (!success)
        {
            return BadRequest(ApiResponse<bool>.FailureResponse("Failed to merge pull request on GitHub.", 400));
        }

        // Update local PR state if exists
        var pr = await _context.PullRequests
            .FirstOrDefaultAsync(p => p.RepositoryId == repo.Id && p.PrNumber == request.PullRequestNumber);
        if (pr is not null)
        {
            pr.State = PrState.Merged;
            pr.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, "PR merged successfully on GitHub."));
    }

    [HttpPost("{id:guid}/post-review")]
    public async Task<ActionResult<ApiResponse<bool>>> PostReviewToGitHub(Guid id, [FromBody] PostReviewCommentsRequestDto request)
    {
        var pr = await _context.PullRequests
            .Include(p => p.Repository)
            .Include(p => p.Comments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pr is null)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Pull request not found.", 404));
        }

        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<bool>.FailureResponse("GitHub token missing.", 401));
        }

        var unpostedComments = pr.Comments.Where(c => !c.IsPostedToGitHub).Select(c => new ReviewCommentDto
        {
            Id = c.Id,
            FilePath = c.FilePath,
            LineNumber = c.LineNumber,
            Side = c.Side,
            Comment = c.Comment,
            SuggestedCode = c.SuggestedCode
        }).ToList();

        var body = request.ReviewSummary ?? pr.AiSummary ?? "GitSight Automated Code Review";

        var posted = await _gitHubService.PostPullRequestReviewAsync(
            token,
            pr.Repository.Owner,
            pr.Repository.Name,
            pr.PrNumber,
            pr.HeadSha,
            body,
            unpostedComments,
            request.Event
        );

        if (posted)
        {
            foreach (var comment in pr.Comments.Where(c => !c.IsPostedToGitHub))
            {
                comment.IsPostedToGitHub = true;
            }
            await _context.SaveChangesAsync();
        }

        return Ok(ApiResponse<bool>.SuccessResponse(posted, "Review comments posted to GitHub."));
    }
}
