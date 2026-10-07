using GitSight.Domain.Enums;

namespace GitSight.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    long? GitHubId { get; }
    string? GitHubAccessToken { get; }
    string? Email { get; }
    Role? Role { get; }
    bool IsAuthenticated { get; }
}
