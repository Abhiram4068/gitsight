namespace GitSight.Application.Configurations;

public class GitHubSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string? WebhookSecret { get; set; }
}
