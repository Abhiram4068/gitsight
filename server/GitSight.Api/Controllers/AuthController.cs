using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.Features.Auth.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitSight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _config;

    public AuthController(
        IAuthService authService,
        ICurrentUserService currentUserService,
        IConfiguration config)
    {
        _authService = authService;
        _currentUserService = currentUserService;
        _config = config;
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        var state = Guid.NewGuid().ToString("N");
        var authUrl = _authService.GetLoginUrl(state);
        return Redirect(authUrl);
    }

    [HttpGet("callback")]
    [HttpGet("/signin-github")]
    public async Task<IActionResult> Callback([FromQuery] string code)
    {
        if (string.IsNullOrEmpty(code))
        {
            return BadRequest(ApiResponse<string>.FailureResponse("Authorization code is missing.", 400));
        }

        var authResult = await _authService.HandleCallbackAsync(code);
        var frontendUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:5173";

        return Redirect($"{frontendUrl}/login?token={authResult.JwtToken}&username={Uri.EscapeDataString(authResult.Username)}");
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetCurrentUser()
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized(ApiResponse<UserProfileDto>.FailureResponse("User identity not found in token claims.", 401));
        }

        var profile = await _authService.GetCurrentUserProfileAsync(userId.Value);
        if (profile is null)
        {
            return NotFound(ApiResponse<UserProfileDto>.FailureResponse("User not found.", 404));
        }

        return Ok(ApiResponse<UserProfileDto>.SuccessResponse(profile, "User profile fetched successfully."));
    }
}
