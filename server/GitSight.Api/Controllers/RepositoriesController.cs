using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.Common.DTOs;
using GitSight.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RepositoriesController : ControllerBase
{
    private readonly IGitHubService _gitHubService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IApplicationDbContext _context;

    public RepositoriesController(
        IGitHubService gitHubService,
        ICurrentUserService currentUserService,
        IApplicationDbContext context)
    {
        _gitHubService = gitHubService;
        _currentUserService = currentUserService;
        _context = context;
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

        // Fetch from GitHub (or local cache)
        var allRepos = await _gitHubService.GetUserRepositoriesAsync(token);

        var query = allRepos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.Name.Contains(search, StringComparison.OrdinalIgnoreCase) 
                                  || r.FullName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var totalCount = query.Count();
        var items = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        var paginatedResult = new PaginatedResponseDto<RepositoryDto>(items, totalCount, pageNumber, pageSize);

        return Ok(ApiResponse<PaginatedResponseDto<RepositoryDto>>.SuccessResponse(paginatedResult, "Repositories fetched successfully."));
    }
}
