using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GitSight.Infrastructure.Services;

/// <summary>
/// Alias for <see cref="PythonReviewService"/> representing the LangGraph Python review microservice.
/// </summary>
public class LangGraphReviewService : PythonReviewService
{
    public LangGraphReviewService(
        HttpClient httpClient, 
        IConfiguration config, 
        ILogger<PythonReviewService> logger) 
        : base(httpClient, config, logger)
    {
    }
}
