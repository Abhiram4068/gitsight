using GitSight.Domain.Enums;

namespace GitSight.Domain.Entities;

public class PullRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int PrNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string HeadSha { get; set; } = string.Empty;
    public string BaseBranch { get; set; } = string.Empty;
    public string HeadBranch { get; set; } = string.Empty;
    public PrState State { get; set; } = PrState.Open;
    public string? DiffContent { get; set; }
    public string? AiSummary { get; set; }
    public string? RiskLevel { get; set; }
    public Guid RepositoryId { get; set; }
    public Repository Repository { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<ReviewComment> Comments { get; set; } = new List<ReviewComment>();
}
