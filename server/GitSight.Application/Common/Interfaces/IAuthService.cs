using GitSight.Application.Features.Auth.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IAuthService
{
    string GetLoginUrl(string state);
    Task<AuthResultDto> HandleCallbackAsync(string code, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> GetCurrentUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}
