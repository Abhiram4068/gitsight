using GitSight.Application.Common.DTOs;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;

namespace GitSight.Application.Services;

public class RepositoryService : IRepositoryService
{
    private readonly IGitHubService _gitHubService;

    public RepositoryService(IGitHubService gitHubService)
    {
        _gitHubService = gitHubService;
    }

    public async Task<PaginatedResponseDto<RepositoryDto>> GetPaginatedRepositoriesAsync(string token, string? search, int pageNumber, int pageSize)
    {
        var allRepos = await _gitHubService.GetUserRepositoriesAsync(token);

        var query = allRepos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.Name.Contains(search, StringComparison.OrdinalIgnoreCase) 
                                  || r.FullName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var totalCount = query.Count();
        var items = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        var fetchPrCountTasks = items.Select(async item =>
        {
            item.OpenPrCount = await _gitHubService.GetOpenPrCountAsync(token, item.Owner, item.Name);
        });

        await Task.WhenAll(fetchPrCountTasks);

        return new PaginatedResponseDto<RepositoryDto>(items, totalCount, pageNumber, pageSize);
    }
}
