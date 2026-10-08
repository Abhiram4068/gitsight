using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GitSight.Application.Common.Interfaces;
using GitSight.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace GitSight.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = User?.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(sub, out var guid) ? guid : null;
        }
    }

    public long? GitHubId
    {
        get
        {
            var ghId = User?.FindFirstValue("github_id");
            return long.TryParse(ghId, out var id) ? id : null;
        }
    }

    public string? GitHubAccessToken => User?.FindFirstValue("github_access_token");

    public string? Email => User?.FindFirstValue(JwtRegisteredClaimNames.Email) ?? User?.FindFirstValue(ClaimTypes.Email);

    public Role? Role
    {
        get
        {
            var roleClaim = User?.FindFirstValue(ClaimTypes.Role);
            return int.TryParse(roleClaim, out var roleInt) ? (Role)roleInt : null;
        }
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
