using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Common.Models;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Logging;

namespace GitSight.Application.Services;

public class RuleService : IRuleService
{
    private readonly IRuleRepository _ruleRepository;
    private readonly ILogger<RuleService> _logger;

    public RuleService(IRuleRepository ruleRepository, ILogger<RuleService> logger)
    {
        _ruleRepository = ruleRepository;
        _logger = logger;
    }

    public async Task<ApiResponse<List<RuleDto>>> GetAllRulesAsync()
    {
        var rules = await _ruleRepository.GetActiveRulesAsync();

        var dtos = rules.Select(r => new RuleDto
        {
            Id = r.Id,
            DisplayName = r.DisplayName,
            Description = r.Description,
            Prompt = r.Prompt,
            Status = r.Status,
            IsSelected = false
        }).ToList();

        return ApiResponse<List<RuleDto>>.SuccessResponse(dtos, "Rules fetched successfully.");
    }

    public async Task<ApiResponse<RepoRulesConfigResponseDto>> GetRepoRuleConfigAsync(string repositoryFullName, Guid userId)
    {
        var allRules = await _ruleRepository.GetActiveRulesAsync();
        var selectedRuleIds = await _ruleRepository.GetSelectedRuleIdsForRepoAsync(repositoryFullName, userId);
        var selectedSet = new HashSet<Guid>(selectedRuleIds);

        var ruleDtos = allRules.Select(r => new RuleDto
        {
            Id = r.Id,
            DisplayName = r.DisplayName,
            Description = r.Description,
            Prompt = r.Prompt,
            Status = r.Status,
            IsSelected = selectedSet.Contains(r.Id)
        }).ToList();

        var result = new RepoRulesConfigResponseDto
        {
            RepositoryFullName = repositoryFullName,
            Rules = ruleDtos,
            SelectedRuleIds = selectedRuleIds
        };

        return ApiResponse<RepoRulesConfigResponseDto>.SuccessResponse(result, "Repository rules configuration fetched.");
    }

    public async Task<ApiResponse<bool>> ApplyRulesAsync(ApplyRulesRequestDto request, Guid userId)
    {
        _logger.LogInformation("Applying rules for repo {Repo} by user {UserId}. Selected rules count: {Count}",
            request.RepositoryFullName, userId, request.RuleIds?.Count ?? 0);

        await _ruleRepository.ApplyRulesForRepoAsync(
            request.RepositoryFullName,
            userId,
            request.RepositoryId,
            request.RuleIds ?? new List<Guid>());

        return ApiResponse<bool>.SuccessResponse(true, "Custom rules applied successfully.");
    }

    public async Task<List<string>> GetActiveRulePromptsForRepoAsync(string repositoryFullName, Guid? userId = null)
    {
        return await _ruleRepository.GetActiveRulePromptsForRepoAsync(repositoryFullName, userId);
    }
}
