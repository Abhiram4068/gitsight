using System;
using System.Collections.Generic;

namespace GitSight.Application.DTOs;

public class RuleDto
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public bool IsSelected { get; set; }
}

public class ApplyRulesRequestDto
{
    public string RepositoryFullName { get; set; } = string.Empty;
    public Guid? RepositoryId { get; set; }
    public List<Guid> RuleIds { get; set; } = new();
}

public class RepoRulesConfigResponseDto
{
    public string RepositoryFullName { get; set; } = string.Empty;
    public List<RuleDto> Rules { get; set; } = new();
    public List<Guid> SelectedRuleIds { get; set; } = new();
}
