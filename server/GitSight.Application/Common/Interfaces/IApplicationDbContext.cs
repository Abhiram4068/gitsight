using GitSight.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Repository> Repositories { get; }
    DbSet<PullRequest> PullRequests { get; }
    DbSet<ReviewComment> ReviewComments { get; }
    DbSet<AiReviewSession> AiReviewSessions { get; }
    DbSet<AiReviewIssue> AiReviewIssues { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
