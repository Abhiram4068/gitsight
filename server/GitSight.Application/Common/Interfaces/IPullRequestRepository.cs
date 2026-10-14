using GitSight.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GitSight.Application.Common.Interfaces;

public interface IPullRequestRepository
{
    Task<Repository?> GetRepositoryByIdAsync(Guid id);
    Task<List<PrInsight>> GetInsightsByRepoAsync(string repositoryFullName);
    Task<PrInsight?> GetInsightByIdAsync(Guid id, bool includeComments = false);
    Task<PrInsight?> GetInsightByPrNumberAsync(string repositoryFullName, int prNumber, bool includeComments = false);
    Task<AiReviewSession?> GetAiReviewSessionAsync(string owner, string repo, int prNumber, bool includeIssues = false);
    Task AddAiReviewSessionAsync(AiReviewSession session);
    Task AddPrInsightAsync(PrInsight insight);
    Task UpdatePrInsightAsync(PrInsight insight);
    Task SaveAnalysisResultsAsync(Guid insightId, string aiSummary, string riskLevel, List<ReviewComment> comments);
    Task SaveChangesAsync();
}
