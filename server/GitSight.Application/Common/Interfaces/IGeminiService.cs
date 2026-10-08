using GitSight.Application.DTOs;

namespace GitSight.Application.Common.Interfaces;

public interface IGeminiService
{
    Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null);
}
