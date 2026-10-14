using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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
public class RulesController : ControllerBase
{
    private readonly IRuleService _ruleService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<RulesController> _logger;

    public RulesController(
        IRuleService ruleService,
        ICurrentUserService currentUserService,
        ILogger<RulesController> logger)
    {
        _ruleService = ruleService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<RuleDto>>>> GetAllRules()
    {
        var response = await _ruleService.GetAllRulesAsync();
        return Ok(response);
    }

    [HttpGet("config")]
    public async Task<ActionResult<ApiResponse<RepoRulesConfigResponseDto>>> GetRepoRuleConfig([FromQuery] string repo)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue || userId.Value == Guid.Empty)
        {
            return Unauthorized(ApiResponse<RepoRulesConfigResponseDto>.FailureResponse("User not authorized.", 401));
        }

        var response = await _ruleService.GetRepoRuleConfigAsync(repo, userId.Value);
        return Ok(response);
    }

    [HttpPost("config")]
    public async Task<ActionResult<ApiResponse<bool>>> ApplyRules([FromBody] ApplyRulesRequestDto request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue || userId.Value == Guid.Empty)
        {
            return Unauthorized(ApiResponse<bool>.FailureResponse("User not authorized.", 401));
        }

        var response = await _ruleService.ApplyRulesAsync(request, userId.Value);
        return Ok(response);
    }
}
