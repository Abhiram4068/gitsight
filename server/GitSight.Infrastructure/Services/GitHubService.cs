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

    public async Task<List<PullRequestDto>> GetPullRequestsAsync(string accessToken, string owner, string repo, string? state = "all")
    {
        var client = CreateClient(accessToken);

        var stateFilter = ItemStateFilter.All;
        if (string.Equals(state, "open", StringComparison.OrdinalIgnoreCase))
        {
            stateFilter = ItemStateFilter.Open;
        }
        else if (string.Equals(state, "closed", StringComparison.OrdinalIgnoreCase) || string.Equals(state, "merged", StringComparison.OrdinalIgnoreCase))
        {
            stateFilter = ItemStateFilter.Closed;
        }

        var prRequest = new PullRequestRequest
        {
            State = stateFilter,
            SortProperty = PullRequestSort.Updated,
            SortDirection = SortDirection.Descending
        };

        var pullRequests = await client.PullRequest.GetAllForRepository(owner, repo, prRequest);

        return pullRequests.Select(pr => new PullRequestDto
        {
            PrNumber = pr.Number,
            Title = pr.Title ?? string.Empty,
            Description = pr.Body,
            State = (pr.Merged || pr.MergedAt.HasValue) ? "merged" : (pr.State.Value == ItemState.Open ? "open" : "closed"),
            IsMerged = pr.Merged || pr.MergedAt.HasValue,
            IsDraft = pr.Draft,
            Author = pr.User?.Login ?? "unknown",
            AuthorAvatarUrl = pr.User?.AvatarUrl,
            HeadBranch = pr.Head?.Ref ?? string.Empty,
            BaseBranch = pr.Base?.Ref ?? string.Empty,
            HeadSha = pr.Head?.Sha ?? string.Empty,
            RepositoryFullName = $"{owner}/{repo}",
            HtmlUrl = pr.HtmlUrl ?? $"https://github.com/{owner}/{repo}/pull/{pr.Number}",
            Additions = pr.Additions,
            Deletions = pr.Deletions,
            ChangedFiles = pr.ChangedFiles,
            CommitsCount = pr.Commits,
            CommentsCount = pr.Comments,
            Labels = pr.Labels != null ? pr.Labels.Select(l => l.Name).ToList() : new List<string>(),
            CreatedAt = pr.CreatedAt.UtcDateTime,
            UpdatedAt = pr.UpdatedAt.UtcDateTime,
            ClosedAt = pr.ClosedAt?.UtcDateTime,
            MergedAt = pr.MergedAt?.UtcDateTime
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

    public async Task<int> GetOpenPrCountAsync(string accessToken, string owner, string repo)
    {
        try
        {
            var client = CreateClient(accessToken);
            var request = new PullRequestRequest
            {
                State = ItemStateFilter.Open
            };
            
            var pullRequests = await client.PullRequest.GetAllForRepository(owner, repo, request);
            return pullRequests.Count;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching PR count for {owner}/{repo}: {ex.Message}");
            return 0; // Return 0 gracefully rather than crashing the entire list
        }
    }

    public async Task<PullRequestDto> GetPullRequestStatsAsync(string accessToken, string owner, string repo, int prNumber)
    {
        try
        {
            var client = CreateClient(accessToken);
            var pr = await client.PullRequest.Get(owner, repo, prNumber);
            return new PullRequestDto
            {
                PrNumber = pr.Number,
                Title = pr.Title,
                State = pr.State.StringValue,
                IsMerged = pr.Merged,
                IsDraft = pr.Draft,
                Author = pr.User.Login,
                AuthorAvatarUrl = pr.User.AvatarUrl,
                HeadBranch = pr.Head.Ref,
                BaseBranch = pr.Base.Ref,
                HeadSha = pr.Head.Sha,
                RepositoryFullName = pr.Base?.Repository?.FullName ?? $"{owner}/{repo}",
                HtmlUrl = pr.HtmlUrl,
                Additions = pr.Additions,
                Deletions = pr.Deletions,
                ChangedFiles = pr.ChangedFiles,
                CommitsCount = pr.Commits,
                CommentsCount = pr.Comments,
                CreatedAt = pr.CreatedAt.UtcDateTime,
                UpdatedAt = pr.UpdatedAt.UtcDateTime,
                ClosedAt = pr.ClosedAt?.UtcDateTime,
                MergedAt = pr.MergedAt?.UtcDateTime
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching PR stats for {owner}/{repo}#{prNumber}: {ex.Message}");
            return new PullRequestDto();
        }
    }

    public async Task<List<PullRequestFileDto>> GetPullRequestFilesAsync(string accessToken, string owner, string repo, int prNumber)
    {
        try
        {
            var client = CreateClient(accessToken);
            var files = await client.PullRequest.Files(owner, repo, prNumber);
            
            return files.Select(f => new PullRequestFileDto
            {
                FileName = f.FileName,
                Status = f.Status,
                Additions = f.Additions,
                Deletions = f.Deletions,
                Changes = f.Changes,
                Patch = f.Patch ?? string.Empty,
                DiffLines = ParsePatch(f.Patch ?? string.Empty)
            }).ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching PR files for {owner}/{repo}#{prNumber}: {ex.Message}");
            return new List<PullRequestFileDto>();
        }
    }

    private List<DiffLineDto> ParsePatch(string patch)
    {
        var lines = new List<DiffLineDto>();
        if (string.IsNullOrEmpty(patch)) return lines;

        var patchLines = patch.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        int? leftLine = null;
        int? rightLine = null;

        foreach (var line in patchLines)
        {
            if (line.StartsWith("@@"))
            {
                var match = System.Text.RegularExpressions.Regex.Match(line, @"@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@");
                if (match.Success)
                {
                    leftLine = int.Parse(match.Groups[1].Value);
                    rightLine = int.Parse(match.Groups[2].Value);
                }
                
                lines.Add(new DiffLineDto { Type = "chunk", Content = line });
            }
            else if (line.StartsWith("+"))
            {
                lines.Add(new DiffLineDto { Type = "added", Content = line, LineCompare = rightLine });
                if (rightLine.HasValue) rightLine++;
            }
            else if (line.StartsWith("-"))
            {
                lines.Add(new DiffLineDto { Type = "deleted", Content = line, LineBase = leftLine });
                if (leftLine.HasValue) leftLine++;
            }
            else if (!line.StartsWith("\\"))
            {
                lines.Add(new DiffLineDto { Type = "normal", Content = line, LineBase = leftLine, LineCompare = rightLine });
                if (leftLine.HasValue) leftLine++;
                if (rightLine.HasValue) rightLine++;
            }
        }

        return lines;
    }
}
