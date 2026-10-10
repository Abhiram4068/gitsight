using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GitSight.Application.Common.Interfaces;
using GitSight.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Infrastructure.Persistence.Repositories;

public class TrackedIssueRepository : ITrackedIssueRepository
{
    private readonly IApplicationDbContext _context;

    public TrackedIssueRepository(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AiReviewIssue>> GetValidIssuesToTrackAsync(Guid sessionId)
    {
        return await _context.AiReviewIssues
            .Where(i => i.AiReviewSessionId == sessionId && !i.IsIgnored)
            .ToListAsync();
    }

    public async Task<List<Guid>> GetExistingTrackedIssueIdsAsync(int pullRequestNumber)
    {
        return await _context.TrackedIssues
            .Where(t => t.PullRequestNumber == pullRequestNumber)
            .Select(t => t.AiReviewIssueId)
            .ToListAsync();
    }

    public async Task AddTrackedIssuesAsync(IEnumerable<TrackedIssue> trackedIssues)
    {
        _context.TrackedIssues.AddRange(trackedIssues);
        await _context.SaveChangesAsync();
    }

    public async Task MarkSessionAsTrackedAsync(Guid sessionId)
    {
        var session = await _context.AiReviewSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session != null)
        {
            session.IsTracked = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveTrackedIssuesAsync(int pullRequestNumber)
    {
        var issues = await _context.TrackedIssues.Where(t => t.PullRequestNumber == pullRequestNumber).ToListAsync();
        if (issues.Any())
        {
            _context.TrackedIssues.RemoveRange(issues);
            await _context.SaveChangesAsync();
        }
    }

    public async Task UnmarkSessionAsTrackedAsync(Guid sessionId)
    {
        var session = await _context.AiReviewSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session != null)
        {
            session.IsTracked = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<TrackedIssue?> GetTrackedIssueByIdAsync(Guid id)
    {
        return await _context.TrackedIssues.FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task UpdateTrackedIssueAsync(TrackedIssue issue)
    {
        _context.TrackedIssues.Update(issue);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AiReviewSession>> GetTrackedPrsAsync(string? search)
    {
        var query = _context.AiReviewSessions.Where(s => s.IsTracked);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => s.Owner.Contains(search) || 
                                     s.Repo.Contains(search) || 
                                     s.PrNumber.ToString().Contains(search));
        }

        return await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
    }

    public async Task<List<TrackedIssue>> GetTrackedIssuesForPrAsync(int prNumber, string? search, string? status, string? severity, string? issueType)
    {
        var query = _context.TrackedIssues.Where(t => t.PullRequestNumber == prNumber);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t => t.FilePath.Contains(search) || 
                                     t.Comment.Contains(search) || 
                                     t.IssueType.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all" && Enum.TryParse<GitSight.Domain.Enums.TrackedIssueStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(t => t.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(severity) && severity.ToLower() != "all")
        {
            query = query.Where(t => t.Severity == severity);
        }

        if (!string.IsNullOrWhiteSpace(issueType) && issueType.ToLower() != "all")
        {
            query = query.Where(t => t.IssueType == issueType);
        }

        return await query.OrderByDescending(t => t.OpenedAt).ToListAsync();
    }
}
