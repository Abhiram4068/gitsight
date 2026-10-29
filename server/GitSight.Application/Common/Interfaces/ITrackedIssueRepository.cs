using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GitSight.Domain.Entities;

namespace GitSight.Application.Common.Interfaces;

public interface ITrackedIssueRepository
{
    Task<List<AiReviewIssue>> GetValidIssuesToTrackAsync(Guid sessionId);
    Task<List<Guid>> GetExistingTrackedIssueIdsAsync(int pullRequestNumber, Guid userId);
    Task AddTrackedIssuesAsync(IEnumerable<TrackedIssue> trackedIssues);
    Task MarkSessionAsTrackedAsync(Guid sessionId);
    Task RemoveTrackedIssuesAsync(int pullRequestNumber, Guid userId);
    Task UnmarkSessionAsTrackedAsync(Guid sessionId);
    
    Task<TrackedIssue?> GetTrackedIssueByIdAsync(Guid id);
    Task UpdateTrackedIssueAsync(TrackedIssue issue);
    
    // GET Methods
    Task<List<AiReviewSession>> GetTrackedPrsAsync(string? search, Guid userId);
    Task<List<TrackedIssue>> GetTrackedIssuesForPrAsync(int prNumber, string? search, string? status, string? severity, string? issueType, Guid userId);

    Task<bool?> ToggleIssueIgnoreAsync(Guid issueId);
}
