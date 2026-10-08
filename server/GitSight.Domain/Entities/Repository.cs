namespace GitSight.Domain.Entities;

public class Repository
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long GitHubRepoId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public bool IsTracked { get; set; } = true;
    public long? WebhookId { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<PullRequest> PullRequests { get; set; } = new List<PullRequest>();
}
