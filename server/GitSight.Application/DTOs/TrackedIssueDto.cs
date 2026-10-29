using System;
using GitSight.Domain.Enums;

namespace GitSight.Application.DTOs;

public class TrackedPrDto
{
    public string Owner { get; set; } = string.Empty;
    public string Repo { get; set; } = string.Empty;
    public int PrNumber { get; set; }
    public DateTime TrackedAt { get; set; }
}

public class TrackedIssueDto
{
    public Guid Id { get; set; }
    public int PullRequestNumber { get; set; }
    public Guid AiReviewIssueId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public int StartLine { get; set; }
    public int EndLine { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string IssueType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string? SuggestedRemovedCode { get; set; }
    public string? SuggestedAddedCode { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateTrackedIssueStatusDto
{
    public string Status { get; set; } = string.Empty;
}
