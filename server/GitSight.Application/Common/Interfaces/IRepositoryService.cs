using GitSight.Application.Common.DTOs;
using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IRepositoryService
{
    Task<PaginatedResponseDto<RepositoryDto>> GetPaginatedRepositoriesAsync(
        string token, string? search = null, string? role = null, string? sortByPrs = null, int pageNumber = 1, int pageSize = 10);
}
