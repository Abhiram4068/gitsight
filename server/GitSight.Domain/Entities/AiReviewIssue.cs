using System.Text.Json.Serialization;

namespace GitSight.Domain.Entities;

public class AiReviewIssue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Relationship
    public Guid AiReviewSessionId { get; set; }
    [JsonIgnore]
    public AiReviewSession Session { get; set; } = null!;

    // Issue Context
    public string FilePath { get; set; } = string.Empty;
    public int StartLine { get; set; }
    public int EndLine { get; set; }

    // Issue Content
    public string Author { get; set; } = "GitSight AI";
    public string Comment { get; set; } = string.Empty;
    
    // Severity and Classification
    public string IssueType { get; set; } = string.Empty; // e.g., Security, Performance, Syntax
    public string Severity { get; set; } = string.Empty;  // e.g., Critical, Warning, Info

    // Diff Suggestion (Optional but very common)
    public string? SuggestedRemovedCode { get; set; }
    public string? SuggestedAddedCode { get; set; }

    public bool IsIgnored { get; set; } = false;

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
