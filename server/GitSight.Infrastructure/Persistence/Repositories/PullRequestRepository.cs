using GitSight.Application.Common.Interfaces;
using GitSight.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GitSight.Infrastructure.Persistence.Repositories;

public class PullRequestRepository : IPullRequestRepository
{
    private readonly IApplicationDbContext _context;

    public PullRequestRepository(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Repository?> GetRepositoryByIdAsync(Guid id)
    {
        return await _context.Repositories.FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<List<PrInsight>> GetInsightsByRepoAsync(string repositoryFullName)
    {
        return await _context.PrInsights
            .Where(p => p.RepositoryFullName == repositoryFullName)
            .ToListAsync();
    }

    public async Task<PrInsight?> GetInsightByIdAsync(Guid id, bool includeComments = false)
    {
        var query = _context.PrInsights.AsQueryable();
        if (includeComments)
        {
            query = query.Include(p => p.Comments);
        }
        return await query.FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PrInsight?> GetInsightByPrNumberAsync(string repositoryFullName, int prNumber, bool includeComments = false)
    {
        var query = _context.PrInsights.AsQueryable();
        if (includeComments)
        {
            query = query.Include(p => p.Comments);
        }
        return await query.FirstOrDefaultAsync(p => p.RepositoryFullName == repositoryFullName && p.PrNumber == prNumber);
    }

    public async Task<AiReviewSession?> GetAiReviewSessionAsync(string owner, string repo, int prNumber, bool includeIssues = false)
    {
        var query = _context.AiReviewSessions.AsQueryable();
        if (includeIssues)
        {
            query = query.Include(s => s.Issues);
        }
        return await query
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(s => s.Owner == owner && s.Repo == repo && s.PrNumber == prNumber);
    }

    public Task AddAiReviewSessionAsync(AiReviewSession session)
    {
        _context.AiReviewSessions.Add(session);
        return Task.CompletedTask;
    }

    public Task AddPrInsightAsync(PrInsight insight)
    {
        _context.PrInsights.Add(insight);
        return Task.CompletedTask;
    }

    public Task UpdatePrInsightAsync(PrInsight insight)
    {
        _context.PrInsights.Update(insight);
        return Task.CompletedTask;
    }

    public async Task SaveAnalysisResultsAsync(Guid insightId, string aiSummary, string riskLevel, List<ReviewComment> comments)
    {
        // 1. Bypass change tracking completely to prevent DbUpdateConcurrencyException
        await _context.PrInsights
            .Where(p => p.Id == insightId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Status, Domain.Enums.PrInsightStatus.Analyzed)
                .SetProperty(p => p.AiSummary, aiSummary)
                .SetProperty(p => p.RiskLevel, riskLevel)
                .SetProperty(p => p.UpdatedAt, DateTime.UtcNow));

        // 2. Insert comments cleanly
        foreach (var c in comments)
        {
            c.PrInsightId = insightId;
            _context.ReviewComments.Add(c);
        }

        // 3. Save only the comments
        await _context.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
