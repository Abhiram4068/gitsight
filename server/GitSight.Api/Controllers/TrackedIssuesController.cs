using FluentValidation;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GitSight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrackedIssuesController : ControllerBase
{
    private readonly ITrackedIssueService _trackedIssueService;
    private readonly IValidator<TrackIssuesRequestDto> _validator;
    private readonly ICurrentUserService _currentUserService;

    public TrackedIssuesController(
        ITrackedIssueService trackedIssueService,
        IValidator<TrackIssuesRequestDto> validator,
        ICurrentUserService currentUserService)
    {
        _trackedIssueService = trackedIssueService;
        _validator = validator;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Attempts to get the current user's ID. Returns true if successful, false otherwise.
    /// </summary>
    private bool TryGetUserId(out Guid userId)
    {
        userId = _currentUserService.UserId ?? Guid.Empty;
        return _currentUserService.UserId.HasValue;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<bool>>> TrackIssues([FromBody] TrackIssuesRequestDto request)
    {
        // Fluent Validation
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<bool>.FailureResponse("Validation failed.", 400, errors));
        }

        if (!TryGetUserId(out var userId))
            return Unauthorized(ApiResponse<bool>.FailureResponse("User identity not found in token claims.", 401));

        var response = await _trackedIssueService.TrackIssuesAsync(request, userId);
        return Ok(response);
    }

    [HttpDelete]
    public async Task<ActionResult<ApiResponse<bool>>> UntrackIssues([FromBody] TrackIssuesRequestDto request)
    {
        // Fluent Validation
        var validationResult = await _validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<bool>.FailureResponse("Validation failed.", 400, errors));
        }

        if (!TryGetUserId(out var userId))
            return Unauthorized(ApiResponse<bool>.FailureResponse("User identity not found in token claims.", 401));

        var response = await _trackedIssueService.UntrackIssuesAsync(request, userId);
        return Ok(response);
    }

    [HttpGet("prs")]
    public async Task<ActionResult<ApiResponse<List<TrackedPrDto>>>> GetTrackedPrs([FromQuery] string? search = null)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(ApiResponse<List<TrackedPrDto>>.FailureResponse("User identity not found in token claims.", 401));

        var response = await _trackedIssueService.GetTrackedPrsAsync(search, userId);
        return Ok(response);
    }

    [HttpGet("prs/{prNumber}/issues")]
    public async Task<ActionResult<ApiResponse<List<TrackedIssueDto>>>> GetTrackedIssuesForPr(
        int prNumber, 
        [FromQuery] string? search = null, 
        [FromQuery] string? status = null, 
        [FromQuery] string? severity = null, 
        [FromQuery] string? issueType = null)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized(ApiResponse<List<TrackedIssueDto>>.FailureResponse("User identity not found in token claims.", 401));

        var response = await _trackedIssueService.GetTrackedIssuesForPrAsync(prNumber, search, status, severity, issueType, userId);
        return Ok(response);
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<ApiResponse<TrackedIssueDto>>> UpdateTrackedIssueStatus(System.Guid id, [FromBody] UpdateTrackedIssueStatusDto request)
    {
        var response = await _trackedIssueService.UpdateTrackedIssueStatusAsync(id, request);
        if (!response.Success)
        {
            if (response.StatusCode == 404) return NotFound(response);
            return BadRequest(response);
        }
        return Ok(response);
    }

    [HttpPatch("issues/{issueId:guid}/toggle-ignore")]
    [HttpPost("issues/{issueId:guid}/toggle-ignore")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleIssueIgnore(Guid issueId)
    {
        var response = await _trackedIssueService.ToggleIssueIgnoreAsync(issueId);
        if (!response.Success)
        {
            if (response.StatusCode == 404) return NotFound(response);
            return BadRequest(response);
        }
        return Ok(response);
    }
}
