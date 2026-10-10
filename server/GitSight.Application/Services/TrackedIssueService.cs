using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using GitSight.Domain.Entities;
using GitSight.Domain.Enums;

namespace GitSight.Application.Services;

public class TrackedIssueService : ITrackedIssueService
{
    private readonly ITrackedIssueRepository _trackedIssueRepository;

    public TrackedIssueService(ITrackedIssueRepository trackedIssueRepository)
    {
        _trackedIssueRepository = trackedIssueRepository;
    }

    public async Task<ApiResponse<bool>> TrackIssuesAsync(TrackIssuesRequestDto request)
    {
        // Get all AI issues for the given session that are NOT ignored via repository
        var validIssuesToTrack = await _trackedIssueRepository.GetValidIssuesToTrackAsync(request.SessionId);

        if (!validIssuesToTrack.Any())
        {
            return ApiResponse<bool>.SuccessResponse(false, "No valid issues to track.");
        }

        // Map valid issues to TrackedIssues
        var trackedIssues = validIssuesToTrack.Select(issue => new TrackedIssue
        {
            PullRequestNumber = request.PullRequestNumber,
            AiReviewIssueId = issue.Id,
            FilePath = issue.FilePath,
            StartLine = issue.StartLine,
            EndLine = issue.EndLine,
            Author = issue.Author,
            Comment = issue.Comment,
            IssueType = issue.IssueType,
            Severity = issue.Severity,
            SuggestedRemovedCode = issue.SuggestedRemovedCode,
            SuggestedAddedCode = issue.SuggestedAddedCode,
            Status = TrackedIssueStatus.Opened,
            OpenedAt = issue.CreatedAt,
            UpdatedAt = System.DateTime.UtcNow
        }).ToList();

        // Check if any of these are already tracked to avoid duplicates
        var existingTrackedIssueIds = await _trackedIssueRepository.GetExistingTrackedIssueIdsAsync(request.PullRequestNumber);

        var newIssues = trackedIssues.Where(t => !existingTrackedIssueIds.Contains(t.AiReviewIssueId)).ToList();

        if (newIssues.Any())
        {
            await _trackedIssueRepository.AddTrackedIssuesAsync(newIssues);
        }

        // Mark the AI Review Session as tracked
        await _trackedIssueRepository.MarkSessionAsTrackedAsync(request.SessionId);
        
        return ApiResponse<bool>.SuccessResponse(true, "Issues tracked successfully.");
    }

    public async Task<ApiResponse<bool>> UntrackIssuesAsync(TrackIssuesRequestDto request)
    {
        await _trackedIssueRepository.RemoveTrackedIssuesAsync(request.PullRequestNumber);
        await _trackedIssueRepository.UnmarkSessionAsTrackedAsync(request.SessionId);
        
        return ApiResponse<bool>.SuccessResponse(true, "Issues untracked successfully.");
    }

    public async Task<ApiResponse<List<TrackedPrDto>>> GetTrackedPrsAsync(string? search)
    {
        var sessions = await _trackedIssueRepository.GetTrackedPrsAsync(search);
        var prs = sessions.Select(s => new TrackedPrDto
        {
            Owner = s.Owner,
            Repo = s.Repo,
            PrNumber = s.PrNumber,
            TrackedAt = s.CreatedAt // Using session CreatedAt as fallback since we don't store separate TrackedAt yet
        }).ToList();
        
        return ApiResponse<List<TrackedPrDto>>.SuccessResponse(prs, "Tracked PRs fetched successfully.");
    }

    public async Task<ApiResponse<List<TrackedIssueDto>>> GetTrackedIssuesForPrAsync(int prNumber, string? search, string? status, string? severity, string? issueType)
    {
        var issues = await _trackedIssueRepository.GetTrackedIssuesForPrAsync(prNumber, search, status, severity, issueType);
        var dtos = issues.Select(i => new TrackedIssueDto
        {
            Id = i.Id,
            PullRequestNumber = i.PullRequestNumber,
            AiReviewIssueId = i.AiReviewIssueId,
            FilePath = i.FilePath,
            StartLine = i.StartLine,
            EndLine = i.EndLine,
            Author = i.Author,
            Comment = i.Comment,
            IssueType = i.IssueType,
            Severity = i.Severity,
            SuggestedRemovedCode = i.SuggestedRemovedCode,
            SuggestedAddedCode = i.SuggestedAddedCode,
            Status = i.Status.ToString(),
            OpenedAt = i.OpenedAt,
            UpdatedAt = i.UpdatedAt
        }).ToList();
        
        return ApiResponse<List<TrackedIssueDto>>.SuccessResponse(dtos, "Tracked issues fetched successfully.");
    }

    public async Task<ApiResponse<TrackedIssueDto>> UpdateTrackedIssueStatusAsync(Guid id, UpdateTrackedIssueStatusDto request)
    {
        var issue = await _trackedIssueRepository.GetTrackedIssueByIdAsync(id);
        if (issue == null)
            return ApiResponse<TrackedIssueDto>.FailureResponse("Issue not found", 404);

        if (!System.Enum.TryParse<TrackedIssueStatus>(request.Status, true, out var parsedStatus))
            return ApiResponse<TrackedIssueDto>.FailureResponse("Invalid status.", 400);

        issue.Status = parsedStatus;
        issue.UpdatedAt = System.DateTime.UtcNow;

        await _trackedIssueRepository.UpdateTrackedIssueAsync(issue);

        var dto = new TrackedIssueDto
        {
            Id = issue.Id,
            PullRequestNumber = issue.PullRequestNumber,
            AiReviewIssueId = issue.AiReviewIssueId,
            FilePath = issue.FilePath,
            StartLine = issue.StartLine,
            EndLine = issue.EndLine,
            Author = issue.Author,
            Comment = issue.Comment,
            IssueType = issue.IssueType,
            Severity = issue.Severity,
            SuggestedRemovedCode = issue.SuggestedRemovedCode,
            SuggestedAddedCode = issue.SuggestedAddedCode,
            Status = issue.Status.ToString(),
            OpenedAt = issue.OpenedAt,
            UpdatedAt = issue.UpdatedAt
        };

        return ApiResponse<TrackedIssueDto>.SuccessResponse(dto, "Issue status updated successfully.");
    }
}
