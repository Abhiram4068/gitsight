using System.Collections.Generic;
using System.Threading.Tasks;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface ITrackedIssueService
{
    Task<ApiResponse<bool>> TrackIssuesAsync(TrackIssuesRequestDto request);
    Task<ApiResponse<bool>> UntrackIssuesAsync(TrackIssuesRequestDto request);
    
    Task<ApiResponse<List<TrackedPrDto>>> GetTrackedPrsAsync(string? search);
    Task<ApiResponse<List<TrackedIssueDto>>> GetTrackedIssuesForPrAsync(int prNumber, string? search, string? status, string? severity, string? issueType);
    Task<ApiResponse<TrackedIssueDto>> UpdateTrackedIssueStatusAsync(Guid id, UpdateTrackedIssueStatusDto request);
}
