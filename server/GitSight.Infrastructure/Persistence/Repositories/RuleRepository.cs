using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GitSight.Application.Common.Interfaces;
using GitSight.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitSight.Infrastructure.Persistence.Repositories;

public class RuleRepository : IRuleRepository
{
    private readonly IApplicationDbContext _context;

    public RuleRepository(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Rule>> GetActiveRulesAsync()
    {
        return await _context.Rules
            .Where(r => r.Status == "Active")
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Guid>> GetSelectedRuleIdsForRepoAsync(string repositoryFullName, Guid userId)
    {
        return await _context.RuleConfigs
            .Where(rc => rc.RepositoryFullName == repositoryFullName && rc.UserId == userId)
            .Select(rc => rc.RuleId)
            .ToListAsync();
    }

    public async Task<List<Guid>> GetValidActiveRuleIdsAsync(IEnumerable<Guid> ruleIds)
    {
        var idList = ruleIds.ToList();
        return await _context.Rules
            .Where(r => idList.Contains(r.Id) && r.Status == "Active")
            .Select(r => r.Id)
            .ToListAsync();
    }

    public async Task ApplyRulesForRepoAsync(string repositoryFullName, Guid userId, Guid? repositoryId, IEnumerable<Guid> ruleIds)
    {
        var existing = await _context.RuleConfigs
            .Where(rc => rc.RepositoryFullName == repositoryFullName && rc.UserId == userId)
            .ToListAsync();

        if (existing.Count > 0)
        {
            _context.RuleConfigs.RemoveRange(existing);
        }

        var validRuleIds = await GetValidActiveRuleIdsAsync(ruleIds);
        if (validRuleIds.Count > 0)
        {
            var newConfigs = validRuleIds.Select(ruleId => new RuleConfig
            {
                UserId = userId,
                RepositoryId = repositoryId,
                RepositoryFullName = repositoryFullName,
                RuleId = ruleId,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.RuleConfigs.AddRange(newConfigs);
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<string>> GetActiveRulePromptsForRepoAsync(string repositoryFullName, Guid? userId = null)
    {
        var query = _context.RuleConfigs
            .Include(rc => rc.Rule)
            .Where(rc => rc.RepositoryFullName == repositoryFullName);

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(rc => rc.UserId == userId.Value);
        }

        return await query
            .Where(rc => rc.Rule != null && rc.Rule.Status == "Active" && !string.IsNullOrWhiteSpace(rc.Rule.Prompt))
            .Select(rc => rc.Rule!.Prompt)
            .Distinct()
            .ToListAsync();
    }

    public async Task<bool> HasUserConfiguredRulesAsync(Guid userId)
    {
        return await _context.RuleConfigs.AnyAsync(rc => rc.UserId == userId);
    }
}
