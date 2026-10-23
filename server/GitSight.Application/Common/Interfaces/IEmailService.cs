using System.Threading;
using System.Threading.Tasks;

namespace GitSight.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default);
    Task SendPrReviewStartedEmailAsync(string toEmail, string owner, string repo, int prNumber, CancellationToken cancellationToken = default);
    Task SendPrReviewCompletedEmailAsync(string toEmail, string owner, string repo, int prNumber, string prInsightUrl, CancellationToken cancellationToken = default);
}
