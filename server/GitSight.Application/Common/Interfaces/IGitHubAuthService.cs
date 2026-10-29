using GitSight.Application.Features.Auth.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IGitHubAuthService
{
    string GetAuthorizationUrl(string state, string? prompt = "select_account");
    Task<GitHubUserDto> ExchangeCodeForUserAsync(string code);
    Task<string?> GetUserPrimaryEmailAsync(string accessToken);
}
