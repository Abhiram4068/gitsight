namespace GitSight.Domain.Entities;

public class AiReviewSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Target PR Identity
    public string Owner { get; set; } = string.Empty;
    public string Repo { get; set; } = string.Empty;
    public int PrNumber { get; set; }

    // Dashboard Metrics
    public int FinalSuggestionsCount { get; set; }
    public int SecurityIssuesCount { get; set; }
    public int SyntaxErrorsCount { get; set; }
    public int BreachesCount { get; set; }
    public int PerformanceIssuesCount { get; set; }
    public int CodeSmellsCount { get; set; }
    public decimal TestCoverageImpact { get; set; }
    public string CodeComplexity { get; set; } = string.Empty;
    public decimal OverallConfidenceScore { get; set; }

    // Summary Text
    public string ExecutiveSummary { get; set; } = string.Empty;

    // Timestamps & State
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsTracked { get; set; } = false;

    // Navigation Property
    public ICollection<AiReviewIssue> Issues { get; set; } = new List<AiReviewIssue>();
}
