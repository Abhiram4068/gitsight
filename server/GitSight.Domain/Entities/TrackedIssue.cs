using System.Text.Json.Serialization;
using GitSight.Domain.Enums;

namespace GitSight.Domain.Entities;

public class TrackedIssue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Core references
    public int PullRequestNumber { get; set; }
    public Guid AiReviewIssueId { get; set; }

    // Issue Context copied from AiReviewIssue
    public string FilePath { get; set; } = string.Empty;
    public int StartLine { get; set; }
    public int EndLine { get; set; }

    // Issue Content
    public string Author { get; set; } = "GitSight AI";
    public string Comment { get; set; } = string.Empty;
    
    // Severity and Classification
    public string IssueType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;

    // Diff Suggestion
    public string? SuggestedRemovedCode { get; set; }
    public string? SuggestedAddedCode { get; set; }

    // Workflow state
    public TrackedIssueStatus Status { get; set; } = TrackedIssueStatus.Opened;

    // Timestamps
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
