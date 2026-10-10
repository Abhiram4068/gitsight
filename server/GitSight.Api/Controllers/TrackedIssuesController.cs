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

    public TrackedIssuesController(
        ITrackedIssueService trackedIssueService,
        IValidator<TrackIssuesRequestDto> validator)
    {
        _trackedIssueService = trackedIssueService;
        _validator = validator;
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

        var response = await _trackedIssueService.TrackIssuesAsync(request);
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

        var response = await _trackedIssueService.UntrackIssuesAsync(request);
        return Ok(response);
    }

    [HttpGet("prs")]
    public async Task<ActionResult<ApiResponse<List<TrackedPrDto>>>> GetTrackedPrs([FromQuery] string? search = null)
    {
        var response = await _trackedIssueService.GetTrackedPrsAsync(search);
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
        var response = await _trackedIssueService.GetTrackedIssuesForPrAsync(prNumber, search, status, severity, issueType);
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
}
