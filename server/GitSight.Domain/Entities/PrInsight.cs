using GitSight.Domain.Enums;

namespace GitSight.Domain.Entities;

public class PrInsight
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RepositoryFullName { get; set; } = string.Empty;
    public int PrNumber { get; set; }
    public PrInsightStatus Status { get; set; } = PrInsightStatus.Pending;
    public PrInsightPriority Priority { get; set; } = PrInsightPriority.Medium;
    public string? AiSummary { get; set; }
    public string? RiskLevel { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<ReviewComment> Comments { get; set; } = new List<ReviewComment>();
}
