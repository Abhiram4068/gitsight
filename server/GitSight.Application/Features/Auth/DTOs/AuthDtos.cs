namespace GitSight.Application.Features.Auth.DTOs;

public record GitHubUserDto(
    long Id,
    string Login,
    string? Email,
    string? AvatarUrl,
    string AccessToken
);

public record AuthResultDto(
    Guid UserId,
    string Username,
    string? Email,
    string? AvatarUrl,
    string JwtToken
);

public record UserProfileDto(
    Guid Id,
    string Username,
    string? Email,
    string? AvatarUrl,
    string Role,
    DateTime CreatedAt
);
