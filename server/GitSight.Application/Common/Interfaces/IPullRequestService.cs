using GitSight.Application.Common.DTOs;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using GitSight.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GitSight.Application.Common.Interfaces;

public interface IPullRequestService
{
    Task<PaginatedResponseDto<PullRequestDto>> GetPullRequestsAsync(
        string token, string? owner, string? repo, string? repoFullName, Guid? repositoryId, string state, string? search, int pageNumber, int pageSize);
    Task<PrDiffResponseDto?> GetPrDiffAsync(string token, Guid id);
    Task<List<PullRequestFileDto>> GetPullRequestFilesAsync(string token, string owner, string repo, int prNumber);
    Task<PullRequestDto> GetPullRequestStatsAsync(string token, string owner, string repo, int prNumber);
    Task<AiReviewSession?> GetPullRequestInsightsAsync(string owner, string repo, int prNumber);
    Task<AiReviewSession> AnalyzePullRequestAsync(string token, string owner, string repo, int prNumber);
    Task<bool> MergePullRequestAsync(string token, MergePrRequestDto request);
    Task<bool> PostReviewToGitHubAsync(string token, Guid id, PostReviewCommentsRequestDto request);
}
