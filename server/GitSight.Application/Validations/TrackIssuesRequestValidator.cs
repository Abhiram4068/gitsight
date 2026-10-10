using FluentValidation;
using GitSight.Application.DTOs;

namespace GitSight.Application.Validations;

public class TrackIssuesRequestValidator : AbstractValidator<TrackIssuesRequestDto>
{
    public TrackIssuesRequestValidator()
    {
        RuleFor(x => x.PullRequestNumber)
            .GreaterThan(0).WithMessage("Pull Request number must be greater than zero.");

        RuleFor(x => x.SessionId)
            .NotEmpty().WithMessage("Session ID is required to track issues.");
    }
}
