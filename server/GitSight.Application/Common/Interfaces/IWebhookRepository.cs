using System.Threading.Tasks;

namespace GitSight.Application.Common.Interfaces;

public interface IWebhookRepository
{
    Task<string?> GetAccessTokenForOwnerIdAsync(long ownerId);
}
