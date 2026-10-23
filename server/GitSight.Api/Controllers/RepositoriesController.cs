using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.Common.DTOs;
using GitSight.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitSight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RepositoriesController : ControllerBase
{
    private readonly IRepositoryService _repositoryService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<RepositoriesController> _logger;

    public RepositoriesController(
        IRepositoryService repositoryService,
        ICurrentUserService currentUserService,
        ILogger<RepositoriesController> logger)
    {
        _repositoryService = repositoryService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponseDto<RepositoryDto>>>> GetRepositories(
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] string? sortByPrs = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("HTTP GET GetRepositories initiated. search={Search}, role={Role}, sortByPrs={SortByPrs}, pageNumber={PageNumber}, pageSize={PageSize}",
            search, role, sortByPrs, pageNumber, pageSize);

        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("GitHub token missing from user session.", 401));
        }

        var paginatedResult = await _repositoryService.GetPaginatedRepositoriesAsync(
            token, search, role, sortByPrs, pageNumber, pageSize);

        return Ok(ApiResponse<PaginatedResponseDto<RepositoryDto>>.SuccessResponse(paginatedResult, "Repositories fetched successfully."));
    }
}
