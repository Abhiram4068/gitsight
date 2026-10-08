using GitSight.Application.Common.DTOs;
using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IRepositoryService
{
    Task<PaginatedResponseDto<RepositoryDto>> GetPaginatedRepositoriesAsync(string token, string? search, int pageNumber, int pageSize);
}
