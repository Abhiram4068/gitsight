using GitSight.Application.Common.Interfaces;
using GitSight.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly GitSightDbContext _context;

    public UserRepository(GitSightDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetByGitHubIdAsync(long gitHubId, CancellationToken cancellationToken = default)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.GitHubId == gitHubId, cancellationToken);
    }

    public async Task<User?> GetActiveUserForWebhookAsync(string owner, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(owner))
        {
            var normalizedOwner = owner.ToLower();
            var matchedUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedOwner && !string.IsNullOrEmpty(u.AccessToken), cancellationToken);

            if (matchedUser != null)
            {
                return matchedUser;
            }
        }

        return await _context.Users
            .FirstOrDefaultAsync(u => !string.IsNullOrEmpty(u.AccessToken), cancellationToken);
    }

    public async Task<User?> GetByUsernameWithAccessTokenAsync(string username, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var normalizedUsername = username.ToLower();
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername && !string.IsNullOrEmpty(u.AccessToken), cancellationToken);
    }

    public async Task<User?> GetFirstActiveUserWithAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => !string.IsNullOrEmpty(u.AccessToken), cancellationToken);
    }

    public async Task<bool> IsEmailAllowedAsync(string email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        return user != null && user.IsEmailAllowed;
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
    }

    public Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
