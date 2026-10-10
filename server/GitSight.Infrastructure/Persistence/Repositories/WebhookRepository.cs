using GitSight.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace GitSight.Infrastructure.Persistence.Repositories;

public class WebhookRepository : IWebhookRepository
{
    private readonly IApplicationDbContext _context;

    public WebhookRepository(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string?> GetAccessTokenForOwnerIdAsync(long ownerId)
    {
        return await _context.Users
            .Where(u => u.GitHubId == ownerId)
            .Select(u => u.AccessToken)
            .FirstOrDefaultAsync();
    }
}
