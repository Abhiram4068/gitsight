namespace GitSight.Application.DTOs;

public class GeminiReviewResultDto
{
    public string ExecutiveSummary { get; set; } = string.Empty;
    public decimal OverallConfidenceScore { get; set; }
    
    public int FinalSuggestionsCount { get; set; }
    public int SecurityIssuesCount { get; set; }
    public int SyntaxErrorsCount { get; set; }
    public int BreachesCount { get; set; }
    public int PerformanceIssuesCount { get; set; }
    public int CodeSmellsCount { get; set; }
    public decimal TestCoverageImpact { get; set; }
    public string CodeComplexity { get; set; } = string.Empty;
    
    public List<GeminiInlineCommentDto> Issues { get; set; } = new();
}

public class GeminiInlineCommentDto
{
    public string FilePath { get; set; } = string.Empty;
    public int StartLine { get; set; }
    public int EndLine { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string IssueType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string? SuggestedRemovedCode { get; set; }
    public string? SuggestedAddedCode { get; set; }
}
