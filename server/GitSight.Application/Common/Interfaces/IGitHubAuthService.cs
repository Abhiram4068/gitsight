using GitSight.Application.Features.Auth.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IGitHubAuthService
{
    string GetAuthorizationUrl(string state);
    Task<GitHubUserDto> ExchangeCodeForUserAsync(string code);
}
