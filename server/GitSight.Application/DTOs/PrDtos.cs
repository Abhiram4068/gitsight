namespace GitSight.Application.DTOs;

public class PrDiffResponseDto
{
    public Guid PullRequestId { get; set; }
    public int PrNumber { get; set; }
    public string PrTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string RepositoryFullName { get; set; } = string.Empty;
    public string DiffContent { get; set; } = string.Empty;
    public string? AiSummary { get; set; }
    public string? RiskLevel { get; set; }
    public List<ReviewCommentDto> Comments { get; set; } = new();
}

public class ReviewCommentDto
{
    public Guid Id { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public int LineNumber { get; set; }
    public string Side { get; set; } = "RIGHT";
    public string Comment { get; set; } = string.Empty;
    public string? SuggestedCode { get; set; }
    public string Severity { get; set; } = "Info";
    public bool IsAiGenerated { get; set; }
    public bool IsPostedToGitHub { get; set; }
}

public class MergePrRequestDto
{
    public Guid RepositoryId { get; set; }
    public int PullRequestNumber { get; set; }
    public string MergeStrategy { get; set; } = "squash"; // "squash", "merge", "rebase"
    public string? CommitTitle { get; set; }
}

public class RepositoryDto
{
    public Guid Id { get; set; }
    public long GitHubRepoId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public bool IsTracked { get; set; }
    public int OpenPrCount { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class PostReviewCommentsRequestDto
{
    public Guid PullRequestId { get; set; }
    public string? ReviewSummary { get; set; }
    public string Event { get; set; } = "COMMENT"; // "COMMENT", "APPROVE", "REQUEST_CHANGES"
}
