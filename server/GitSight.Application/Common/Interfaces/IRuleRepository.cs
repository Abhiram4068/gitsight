using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GitSight.Domain.Entities;

namespace GitSight.Application.Common.Interfaces;

public interface IRuleRepository
{
    Task<List<Rule>> GetActiveRulesAsync();
    Task<List<Guid>> GetSelectedRuleIdsForRepoAsync(string repositoryFullName, Guid userId);
    Task<List<Guid>> GetValidActiveRuleIdsAsync(IEnumerable<Guid> ruleIds);
    Task ApplyRulesForRepoAsync(string repositoryFullName, Guid userId, Guid? repositoryId, IEnumerable<Guid> ruleIds);
    Task<List<string>> GetActiveRulePromptsForRepoAsync(string repositoryFullName, Guid? userId = null);
    Task<bool> HasUserConfiguredRulesAsync(Guid userId);
}
