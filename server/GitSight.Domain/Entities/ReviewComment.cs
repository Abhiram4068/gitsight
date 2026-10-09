using GitSight.Domain.Enums;

namespace GitSight.Domain.Entities;

public class ReviewComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PrInsightId { get; set; }
    public PrInsight PrInsight { get; set; } = null!;
    public string FilePath { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string Side { get; set; } = "RIGHT";
    public string Comment { get; set; } = string.Empty;
    public string? SuggestedCode { get; set; }
    public ReviewSeverity Severity { get; set; } = ReviewSeverity.Info;
    public bool IsAiGenerated { get; set; } = true;
    public bool IsPostedToGitHub { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
