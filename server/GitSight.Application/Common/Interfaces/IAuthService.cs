using GitSight.Application.Features.Auth.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IAuthService
{
    string GetLoginUrl(string state, string? prompt = "select_account");
    Task<AuthResultDto> HandleCallbackAsync(string code, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> GetCurrentUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserToggleEmailDto?> ToggleEmailAsync(Guid userId, CancellationToken cancellationToken = default);
}
