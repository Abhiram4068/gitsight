using System.Threading.Tasks;

namespace GitSight.Application.Common.Interfaces;

public interface IWebhookService
{
    Task ProcessPullRequestWebhookAsync(long ownerId, string owner, string repoName, int prNumber);
}
