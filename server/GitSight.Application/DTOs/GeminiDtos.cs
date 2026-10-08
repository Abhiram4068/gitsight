namespace GitSight.Application.DTOs;

public class GeminiReviewResultDto
{
    public string Summary { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "LOW";
    public List<string> KeyFindings { get; set; } = new();
    public List<GeminiInlineCommentDto> InlineComments { get; set; } = new();
}

public class GeminiInlineCommentDto
{
    public string Path { get; set; } = string.Empty;
    public int Line { get; set; }
    public string Side { get; set; } = "RIGHT";
    public string Comment { get; set; } = string.Empty;
    public string? SuggestedCode { get; set; }
    public string Severity { get; set; } = "Info";
}
