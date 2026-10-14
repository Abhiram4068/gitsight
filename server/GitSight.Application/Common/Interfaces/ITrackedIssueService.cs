using System.Collections.Generic;
using System.Threading.Tasks;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface ITrackedIssueService
{
    Task<ApiResponse<bool>> TrackIssuesAsync(TrackIssuesRequestDto request, Guid userId);
    Task<ApiResponse<bool>> UntrackIssuesAsync(TrackIssuesRequestDto request, Guid userId);
    
    Task<ApiResponse<List<TrackedPrDto>>> GetTrackedPrsAsync(string? search, Guid userId);
    Task<ApiResponse<List<TrackedIssueDto>>> GetTrackedIssuesForPrAsync(int prNumber, string? search, string? status, string? severity, string? issueType, Guid userId);
    Task<ApiResponse<TrackedIssueDto>> UpdateTrackedIssueStatusAsync(Guid id, UpdateTrackedIssueStatusDto request);
    Task<ApiResponse<bool>> ToggleIssueIgnoreAsync(Guid issueId);
}
