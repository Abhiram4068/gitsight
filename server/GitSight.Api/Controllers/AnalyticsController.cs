using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace GitSight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        ICurrentUserService currentUserService,
        ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<DashboardAnalyticsDto>>> GetDashboardAnalytics()
    {
        _logger.LogInformation("HTTP GET GetDashboardAnalytics called.");
        var token = _currentUserService.GitHubAccessToken;
        var userId = _currentUserService.UserId;

        var response = await _analyticsService.GetDashboardAnalyticsAsync(token, userId);
        return Ok(response);
    }
}
