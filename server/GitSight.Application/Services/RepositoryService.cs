using GitSight.Application.Common.DTOs;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Logging;

namespace GitSight.Application.Services;

public class RepositoryService : IRepositoryService
{
    private readonly IGitHubService _gitHubService;
    private readonly ILogger<RepositoryService> _logger;

    public RepositoryService(
        IGitHubService gitHubService,
        ILogger<RepositoryService> logger)
    {
        _gitHubService = gitHubService;
        _logger = logger;
    }

    public async Task<PaginatedResponseDto<RepositoryDto>> GetPaginatedRepositoriesAsync(
        string token, string? search = null, string? role = null, string? sortByPrs = null, int pageNumber = 1, int pageSize = 10)
    {
        _logger.LogInformation("GetPaginatedRepositoriesAsync called for search: {Search}, role: {Role}, sortByPrs: {SortByPrs}, page: {PageNumber}, pageSize: {PageSize}",
            search, role, sortByPrs, pageNumber, pageSize);

        pageNumber = Math.Max(1, pageNumber);
        pageSize = pageSize <= 0 ? 10 : pageSize;

        var allRepos = await _gitHubService.GetUserRepositoriesAsync(token);

        var query = allRepos.AsQueryable();

        // Filter by role / privacy
        if (!string.IsNullOrWhiteSpace(role) && !string.Equals(role, "all", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(role, "private", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.IsPrivate);
            }
            else if (string.Equals(role, "public", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => !r.IsPrivate);
            }
        }

        // Filter by search
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.Name.Contains(search, StringComparison.OrdinalIgnoreCase) 
                                  || r.FullName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        // Sort by PR count if requested
        if (!string.IsNullOrWhiteSpace(sortByPrs) && !string.Equals(sortByPrs, "none", StringComparison.OrdinalIgnoreCase))
        {
            var filteredRepos = query.ToList();
            var prTasks = filteredRepos.Select(async item =>
            {
                item.OpenPrCount = await _gitHubService.GetOpenPrCountAsync(token, item.Owner, item.Name);
            });
            await Task.WhenAll(prTasks);

            if (string.Equals(sortByPrs, "desc", StringComparison.OrdinalIgnoreCase))
            {
                filteredRepos = filteredRepos.OrderByDescending(r => r.OpenPrCount).ToList();
            }
            else if (string.Equals(sortByPrs, "asc", StringComparison.OrdinalIgnoreCase))
            {
                filteredRepos = filteredRepos.OrderBy(r => r.OpenPrCount).ToList();
            }

            var totalCount = filteredRepos.Count;
            var items = filteredRepos.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

            return new PaginatedResponseDto<RepositoryDto>(items, totalCount, pageNumber, pageSize);
        }
        else
        {
            var totalCount = query.Count();
            var items = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

            // Fetch open PR counts ONLY for the paginated items on this page
            var fetchPrCountTasks = items.Select(async item =>
            {
                item.OpenPrCount = await _gitHubService.GetOpenPrCountAsync(token, item.Owner, item.Name);
            });

            await Task.WhenAll(fetchPrCountTasks);

            return new PaginatedResponseDto<RepositoryDto>(items, totalCount, pageNumber, pageSize);
        }
    }
}
