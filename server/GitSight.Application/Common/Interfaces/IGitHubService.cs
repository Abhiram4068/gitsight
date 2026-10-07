using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IGitHubService
{
    Task<List<RepositoryDto>> GetUserRepositoriesAsync(string accessToken);
    Task<List<PullRequestDto>> GetPullRequestsAsync(string accessToken, string owner, string repo, string? state = "all");
    Task<string> GetPullRequestDiffAsync(string accessToken, string owner, string repo, int prNumber);
    Task<bool> PostPullRequestReviewAsync(string accessToken, string owner, string repo, int prNumber, string headSha, string body, List<ReviewCommentDto> comments, string reviewEvent = "COMMENT");
    Task<bool> MergePullRequestAsync(string accessToken, string owner, string repo, int prNumber, string mergeStrategy, string? commitTitle = null);
}
