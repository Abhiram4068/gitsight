using System.Collections.Generic;

namespace GitSight.Application.DTOs;

public class DashboardAnalyticsDto
{
    public int TotalPrs { get; set; }
    public int TotalRepos { get; set; }
    public int TotalTrackedPrs { get; set; }
    public int TotalAiReviews { get; set; }
    public int TotalAiIssues { get; set; }
    public decimal AverageConfidenceScore { get; set; }

    public List<PullRequestDto> RecentPrs { get; set; } = new();
}
