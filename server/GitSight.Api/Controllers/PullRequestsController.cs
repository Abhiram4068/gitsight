using FluentValidation;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.Common.DTOs;
using GitSight.Application.DTOs;
using GitSight.Domain.Entities;
using GitSight.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.Extensions.Logging;

namespace GitSight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PullRequestsController : ControllerBase
{
    private readonly IPullRequestService _pullRequestService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<MergePrRequestDto> _mergeValidator;
    private readonly ILogger<PullRequestsController> _logger;

    public PullRequestsController(
        IPullRequestService pullRequestService,
        ICurrentUserService currentUserService,
        IValidator<MergePrRequestDto> mergeValidator,
        ILogger<PullRequestsController> logger)
    {
        _pullRequestService = pullRequestService;
        _currentUserService = currentUserService;
        _mergeValidator = mergeValidator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponseDto<PullRequestDto>>>> GetPullRequests(
        [FromQuery] string? owner = null,
        [FromQuery] string? repo = null,
        [FromQuery] string? repoFullName = null,
        [FromQuery] Guid? repositoryId = null,
        [FromQuery] string state = "all",
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("HTTP GET GetPullRequests initiated. owner={Owner}, repo={Repo}, repoFullName={RepoFullName}, repositoryId={RepositoryId}, state={State}, search={Search}, pageNumber={PageNumber}, pageSize={PageSize}",
            owner, repo, repoFullName, repositoryId, state, search, pageNumber, pageSize);

        var token = _currentUserService.GitHubAccessToken;
        var paginatedResult = await _pullRequestService.GetPullRequestsAsync(
            token, owner, repo, repoFullName, repositoryId, state, search, pageNumber, pageSize);
        
        return Ok(ApiResponse<PaginatedResponseDto<PullRequestDto>>.SuccessResponse(paginatedResult, "Pull requests fetched successfully."));
    }

    [HttpGet("{id:guid}/diff")]
    public async Task<ActionResult<ApiResponse<PrDiffResponseDto>>> GetPrDiff(Guid id)
    {
        _logger.LogInformation("HTTP GET GetPrDiff initiated for ID: {Id}", id);
        var token = _currentUserService.GitHubAccessToken;
        var diffDto = await _pullRequestService.GetPrDiffAsync(token, id);

        if (diffDto is null)
        {
            return NotFound(ApiResponse<object>.FailureResponse("Pull request insight not found.", 404));
        }

        return Ok(ApiResponse<PrDiffResponseDto>.SuccessResponse(diffDto, "PR Diff fetched successfully."));
    }

    [HttpGet("{owner}/{repo}/{prNumber}/files")]
    public async Task<ActionResult<ApiResponse<List<PullRequestFileDto>>>> GetPullRequestFiles(string owner, string repo, int prNumber)
    {
        _logger.LogInformation("HTTP GET GetPullRequestFiles initiated. owner={Owner}, repo={Repo}, prNumber={PrNumber}", owner, repo, prNumber);
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<List<PullRequestFileDto>>.FailureResponse("GitHub token missing.", 401));
        }

        var files = await _pullRequestService.GetPullRequestFilesAsync(token, owner, repo, prNumber);
        return Ok(ApiResponse<List<PullRequestFileDto>>.SuccessResponse(files, "PR files fetched successfully."));
    }

    [HttpGet("{owner}/{repo}/{prNumber}/stats")]
    public async Task<ActionResult<ApiResponse<PullRequestDto>>> GetPullRequestStats(string owner, string repo, int prNumber)
    {
        _logger.LogInformation("HTTP GET GetPullRequestStats initiated. owner={Owner}, repo={Repo}, prNumber={PrNumber}", owner, repo, prNumber);
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<PullRequestDto>.FailureResponse("GitHub token missing.", 401));
        }

        var prDetails = await _pullRequestService.GetPullRequestStatsAsync(token, owner, repo, prNumber);
        return Ok(ApiResponse<PullRequestDto>.SuccessResponse(prDetails, "PR details fetched successfully."));
    }

    [HttpGet("{owner}/{repo}/{prNumber}/insights")]
    public async Task<ActionResult<ApiResponse<AiReviewSession>>> GetPullRequestInsights(string owner, string repo, int prNumber)
    {
        _logger.LogInformation("HTTP GET GetPullRequestInsights initiated. owner={Owner}, repo={Repo}, prNumber={PrNumber}", owner, repo, prNumber);
        var session = await _pullRequestService.GetPullRequestInsightsAsync(owner, repo, prNumber);
        if (session == null)
        {
            return NotFound(ApiResponse<AiReviewSession>.FailureResponse("No AI insights found for this pull request.", 404));
        }

        return Ok(ApiResponse<AiReviewSession>.SuccessResponse(session, "AI Code Review insights fetched successfully."));
    }

    [HttpPost("{owner}/{repo}/{prNumber}/analyze")]
    public async Task<ActionResult<ApiResponse<AiReviewSession>>> AnalyzePullRequest(string owner, string repo, int prNumber)
    {
        _logger.LogInformation("AnalyzePullRequest invoked for owner: {Owner}, repo: {Repo}, prNumber: {PrNumber}", owner, repo, prNumber);
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("Unauthorized access attempt. GitHub token missing.");
            return Unauthorized(ApiResponse<AiReviewSession>.FailureResponse("GitHub token missing.", 401));
        }

        try
        {
            var session = await _pullRequestService.AnalyzePullRequestAsync(token, owner, repo, prNumber);
            _logger.LogInformation("Successfully completed AnalyzePullRequest for PR #{PrNumber}", prNumber);
            return Ok(ApiResponse<AiReviewSession>.SuccessResponse(session, "AI Code Review completed successfully."));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validation or operational failure during AnalyzePullRequest for PR #{PrNumber}", prNumber);
            return BadRequest(ApiResponse<AiReviewSession>.FailureResponse(ex.Message, 400));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during AnalyzePullRequest for PR #{PrNumber}", prNumber);
            return StatusCode(500, ApiResponse<AiReviewSession>.FailureResponse("Failed to generate AI review.", 500));
        }
    }

    [HttpPost("merge")]
    public async Task<ActionResult<ApiResponse<bool>>> MergePullRequest([FromBody] MergePrRequestDto request)
    {
        _logger.LogInformation("HTTP POST MergePullRequest initiated for PR #{PrNumber} in RepoId={RepositoryId}", request.PullRequestNumber, request.RepositoryId);
        var validationResult = await _mergeValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<bool>.FailureResponse("Validation failed.", 400, errors));
        }

        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<bool>.FailureResponse("GitHub access token not available in session.", 401));
        }

        try
        {
            var success = await _pullRequestService.MergePullRequestAsync(token, request);
            if (!success)
            {
                return BadRequest(ApiResponse<bool>.FailureResponse("Failed to merge pull request on GitHub.", 400));
            }
            return Ok(ApiResponse<bool>.SuccessResponse(true, "PR merged successfully on GitHub."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Repository not found.", 404));
        }
    }

    [HttpPost("{id:guid}/post-review")]
    public async Task<ActionResult<ApiResponse<bool>>> PostReviewToGitHub(Guid id, [FromBody] PostReviewCommentsRequestDto request)
    {
        _logger.LogInformation("HTTP POST PostReviewToGitHub initiated for PR Insight ID: {Id}", id);
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<bool>.FailureResponse("GitHub token missing.", 401));
        }

        try
        {
            var posted = await _pullRequestService.PostReviewToGitHubAsync(token, id, request);
            return Ok(ApiResponse<bool>.SuccessResponse(posted, "Review comments posted to GitHub."));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<bool>.FailureResponse("Pull request insight not found.", 404));
        }
    }
}
