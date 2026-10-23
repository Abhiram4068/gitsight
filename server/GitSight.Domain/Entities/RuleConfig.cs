using System;

namespace GitSight.Domain.Entities;

public class RuleConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid? RepositoryId { get; set; }
    public string RepositoryFullName { get; set; } = string.Empty;
    public Guid RuleId { get; set; }
    public Rule? Rule { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
