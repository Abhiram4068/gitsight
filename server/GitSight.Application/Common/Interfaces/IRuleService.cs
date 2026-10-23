using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IRuleService
{
    Task<ApiResponse<List<RuleDto>>> GetAllRulesAsync();
    Task<ApiResponse<RepoRulesConfigResponseDto>> GetRepoRuleConfigAsync(string repositoryFullName, Guid userId);
    Task<ApiResponse<bool>> ApplyRulesAsync(ApplyRulesRequestDto request, Guid userId);
    Task<List<string>> GetActiveRulePromptsForRepoAsync(string repositoryFullName, Guid? userId = null);
}
