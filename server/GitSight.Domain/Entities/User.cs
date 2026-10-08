using GitSight.Domain.Enums;

namespace GitSight.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long GitHubId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public Role Role { get; set; } = Role.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Repository> Repositories { get; set; } = new List<Repository>();
}
