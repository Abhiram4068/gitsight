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

    public RepositoriesController(
        IRepositoryService repositoryService,
        ICurrentUserService currentUserService)
    {
        _repositoryService = repositoryService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginatedResponseDto<RepositoryDto>>>> GetRepositories(
        [FromQuery] string? search = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var token = _currentUserService.GitHubAccessToken;
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized(ApiResponse<object>.FailureResponse("GitHub token missing from user session.", 401));
        }

        var paginatedResult = await _repositoryService.GetPaginatedRepositoriesAsync(token, search, pageNumber, pageSize);

        return Ok(ApiResponse<PaginatedResponseDto<RepositoryDto>>.SuccessResponse(paginatedResult, "Repositories fetched successfully."));
    }
}
