using FluentValidation;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
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
