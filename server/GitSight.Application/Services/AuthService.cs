using GitSight.Application.Common.Interfaces;
using GitSight.Application.Features.Auth.DTOs;
using GitSight.Domain.Entities;
using GitSight.Domain.Enums;

namespace GitSight.Application.Services;

public class AuthService : IAuthService
{
    private readonly IGitHubAuthService _gitHubAuthService;
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;

    public AuthService(
        IGitHubAuthService gitHubAuthService,
        IUserRepository userRepository,
        IJwtService jwtService)
    {
        _gitHubAuthService = gitHubAuthService;
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    public string GetLoginUrl(string state)
    {
        return _gitHubAuthService.GetAuthorizationUrl(state);
    }

    public async Task<AuthResultDto> HandleCallbackAsync(string code, CancellationToken cancellationToken = default)
    {
        var ghUser = await _gitHubAuthService.ExchangeCodeForUserAsync(code);

        var user = await _userRepository.GetByGitHubIdAsync(ghUser.Id, cancellationToken);
        if (user is null)
        {
            user = new User
            {
                GitHubId = ghUser.Id,
                Username = ghUser.Login,
                Email = ghUser.Email,
                AvatarUrl = ghUser.AvatarUrl,
                AccessToken = ghUser.AccessToken,
                Role = Role.User
            };
            await _userRepository.AddAsync(user, cancellationToken);
        }
        else
        {
            user.AccessToken = ghUser.AccessToken;
            user.AvatarUrl = ghUser.AvatarUrl;
            user.Email = ghUser.Email;
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user, cancellationToken);
        }

        await _userRepository.SaveChangesAsync(cancellationToken);

        var token = _jwtService.GenerateToken(user);
        return new AuthResultDto(user.Id, user.Username, user.Email, user.AvatarUrl, token);
    }

    public async Task<UserProfileDto?> GetCurrentUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null) return null;

        return new UserProfileDto(
            user.Id,
            user.Username,
            user.Email,
            user.AvatarUrl,
            user.Role.ToString(),
            user.CreatedAt
        );
    }
}
