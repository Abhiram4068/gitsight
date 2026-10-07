using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;
using Octokit;

namespace GitSight.Infrastructure.Services;

public class GitHubService : IGitHubService
{
    private readonly HttpClient _httpClient;

    public GitHubService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    private GitHubClient CreateClient(string accessToken)
    {
        return new GitHubClient(new Octokit.ProductHeaderValue("GitSight-Agent"))
        {
            Credentials = new Credentials(accessToken)
        };
    }

    public async Task<List<RepositoryDto>> GetUserRepositoriesAsync(string accessToken)
    {
        var client = CreateClient(accessToken);
        
        // Fetch repositories: user owned + collaborator
        var repos = await client.Repository.GetAllForCurrent(new RepositoryRequest
        {
            Affiliation = RepositoryAffiliation.Owner | RepositoryAffiliation.Collaborator | RepositoryAffiliation.OrganizationMember,
            Sort = RepositorySort.Updated,
            Direction = SortDirection.Descending
        });

        return repos.Select(r => new RepositoryDto
        {
            GitHubRepoId = r.Id,
            Name = r.Name,
            FullName = r.FullName,
            Owner = r.Owner.Login,
            IsPrivate = r.Private,
            IsTracked = true,
            UpdatedAt = r.UpdatedAt.UtcDateTime
        }).ToList();
    }

    public async Task<string> GetPullRequestDiffAsync(string accessToken, string owner, string repo, int prNumber)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}");
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("GitSight-Agent", "1.0"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3.diff"));

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadAsStringAsync();
    }

    public async Task<bool> PostPullRequestReviewAsync(
        string accessToken,
        string owner,
        string repo,
        int prNumber,
        string headSha,
        string body,
        List<ReviewCommentDto> comments,
        string reviewEvent = "COMMENT")
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.github.com/repos/{owner}/{repo}/pulls/{prNumber}/reviews");
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("GitSight-Agent", "1.0"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

        var payload = new
        {
            commit_id = headSha,
            body = body,
            @event = reviewEvent,
            comments = comments.Select(c => new
            {
                path = c.FilePath,
                line = c.LineNumber,
                side = c.Side,
                body = string.IsNullOrEmpty(c.SuggestedCode) 
                    ? c.Comment 
                    : $"{c.Comment}\n\n```suggestion\n{c.SuggestedCode}\n```"
            })
        };

        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> MergePullRequestAsync(
        string accessToken,
        string owner,
        string repo,
        int prNumber,
        string mergeStrategy,
        string? commitTitle = null)
    {
        var client = CreateClient(accessToken);
        
        var pullRequestMerge = new MergePullRequest
        {
            CommitTitle = commitTitle ?? $"Merge pull request #{prNumber} via GitSight",
            MergeMethod = mergeStrategy.ToLower() switch
            {
                "squash" => PullRequestMergeMethod.Squash,
                "rebase" => PullRequestMergeMethod.Rebase,
                _ => PullRequestMergeMethod.Merge
            }
        };

        var result = await client.PullRequest.Merge(owner, repo, prNumber, pullRequestMerge);
        return result.Merged;
    }
}
