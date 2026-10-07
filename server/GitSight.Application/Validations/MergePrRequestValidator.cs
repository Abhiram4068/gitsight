using FluentValidation;
using GitSight.Application.DTOs;

namespace GitSight.Application.Validations;

public class MergePrRequestValidator : AbstractValidator<MergePrRequestDto>
{
    public MergePrRequestValidator()
    {
        RuleFor(x => x.RepositoryId)
            .NotEmpty().WithMessage("Repository ID is required.");

        RuleFor(x => x.PullRequestNumber)
            .GreaterThan(0).WithMessage("Invalid PR number.");

        RuleFor(x => x.MergeStrategy)
            .Must(x => x == "squash" || x == "merge" || x == "rebase")
            .WithMessage("Invalid merge strategy. Must be 'squash', 'merge', or 'rebase'.");
    }
}
