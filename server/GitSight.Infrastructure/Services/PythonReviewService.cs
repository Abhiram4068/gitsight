using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GitSight.Infrastructure.Services;

public class PythonReviewService : IAiReviewService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PythonReviewService> _logger;
    private readonly string _baseUrl;
    private readonly string _endpointPath;
    private readonly string? _apiKey;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public PythonReviewService(HttpClient httpClient, IConfiguration config, ILogger<PythonReviewService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        _baseUrl = config["PythonReviewService:BaseUrl"] 
                   ?? config["PythonReviewService:Url"] 
                   ?? config["ReviewService:Url"] 
                   ?? config["ReviewService:BaseUrl"]
                   ?? "http://localhost:8000";

        _endpointPath = config["PythonReviewService:Endpoint"] 
                        ?? config["ReviewService:Endpoint"] 
                        ?? "/v1/reviews";

        _apiKey = config["PythonReviewService:ApiKey"] 
                  ?? config["ReviewService:ApiKey"] 
                  ?? config["PythonReviewServiceApiKey"]
                  ?? config["SERVICE_API_KEY"]
                  ?? Environment.GetEnvironmentVariable("SERVICE_API_KEY");
    }

    public async Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null, List<string>? customRules = null)
    {
        var endpoint = $"{_baseUrl.TrimEnd('/')}/{_endpointPath.TrimStart('/')}";
        _logger.LogInformation(
            "Sending PR diff to Python review service at {Endpoint}. PR: \"{PrTitle}\", Diff length: {DiffLength}, Custom rules count: {RuleCount}",
            endpoint, prTitle, diffText.Length, customRules?.Count ?? 0);

        var payload = new
        {
            diff_text = diffText,
            diff = diffText,
            pr_title = prTitle,
            pr_description = prDescription ?? string.Empty,
            custom_rules = customRules ?? new List<string>()
        };

        var jsonPayload = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json")
        };

        if (!string.IsNullOrWhiteSpace(_apiKey))
        {
            request.Headers.Add("X-API-Key", _apiKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to reach Python review service at {Endpoint}. Is the Render service online or starting up?", endpoint);
            throw new HttpRequestException($"Failed to reach Python review service at {endpoint}: {ex.Message}", ex);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Request to Python review service at {Endpoint} timed out (Render cold-start or heavy LLM processing).", endpoint);
            throw new TimeoutException($"Python review service timed out after {_httpClient.Timeout.TotalSeconds}s: {ex.Message}", ex);
        }

        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Python review service returned status {StatusCode}: {ResponseBody}", response.StatusCode, responseBody);
            throw new HttpRequestException(
                $"Python review service failed with HTTP {((int)response.StatusCode)} ({response.StatusCode}): {responseBody}");
        }

        try
        {
            // First attempt: standard case-insensitive deserialization (matches camelCase and PascalCase)
            var result = JsonSerializer.Deserialize<GeminiReviewResultDto>(responseBody, JsonOptions);

            // Fallback: if response returned snake_case fields (e.g., executive_summary instead of executiveSummary)
            if (result == null || (string.IsNullOrEmpty(result.ExecutiveSummary) && result.Issues.Count == 0))
            {
                result = ParseFallbackSnakeCase(responseBody);
            }

            if (result == null || string.IsNullOrWhiteSpace(result.ExecutiveSummary))
            {
                _logger.LogWarning("Python review service returned empty executive summary. Body: {Body}", responseBody);
            }
            else
            {
                _logger.LogInformation(
                    "Python review service analysis completed successfully. Extracted {IssueCount} issues. Complexity: {Complexity}",
                    result.Issues.Count, result.CodeComplexity);
            }

            return result ?? new GeminiReviewResultDto
            {
                ExecutiveSummary = "AI analysis completed without detailed feedback.",
                OverallConfidenceScore = 0.8m
            };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse JSON response from Python review service. Raw response: {ResponseBody}", responseBody);
            throw new InvalidOperationException($"Invalid JSON received from Python review service: {ex.Message}", ex);
        }
    }

    private static GeminiReviewResultDto? ParseFallbackSnakeCase(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var dto = new GeminiReviewResultDto();

            if (root.TryGetProperty("executive_summary", out var es)) dto.ExecutiveSummary = es.GetString() ?? string.Empty;
            else if (root.TryGetProperty("executiveSummary", out var es2)) dto.ExecutiveSummary = es2.GetString() ?? string.Empty;

            if (root.TryGetProperty("overall_confidence_score", out var cs)) dto.OverallConfidenceScore = cs.GetDecimal();
            else if (root.TryGetProperty("overallConfidenceScore", out var cs2)) dto.OverallConfidenceScore = cs2.GetDecimal();

            if (root.TryGetProperty("final_suggestions_count", out var fs)) dto.FinalSuggestionsCount = fs.GetInt32();
            if (root.TryGetProperty("security_issues_count", out var si)) dto.SecurityIssuesCount = si.GetInt32();
            if (root.TryGetProperty("syntax_errors_count", out var syn)) dto.SyntaxErrorsCount = syn.GetInt32();
            if (root.TryGetProperty("breaches_count", out var br)) dto.BreachesCount = br.GetInt32();
            if (root.TryGetProperty("performance_issues_count", out var pi)) dto.PerformanceIssuesCount = pi.GetInt32();
            if (root.TryGetProperty("code_smells_count", out var csm)) dto.CodeSmellsCount = csm.GetInt32();
            if (root.TryGetProperty("test_coverage_impact", out var tc)) dto.TestCoverageImpact = tc.GetDecimal();

            if (root.TryGetProperty("code_complexity", out var cc)) dto.CodeComplexity = cc.GetString() ?? "Low";
            else if (root.TryGetProperty("codeComplexity", out var cc2)) dto.CodeComplexity = cc2.GetString() ?? "Low";

            var issuesProp = root.TryGetProperty("issues", out var issuesEl) ? issuesEl : default;
            if (issuesProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in issuesProp.EnumerateArray())
                {
                    var comment = new GeminiInlineCommentDto
                    {
                        FilePath = GetStringProp(item, "filePath", "file_path"),
                        StartLine = GetIntProp(item, "startLine", "start_line"),
                        EndLine = GetIntProp(item, "endLine", "end_line"),
                        Comment = GetStringProp(item, "comment"),
                        IssueType = GetStringProp(item, "issueType", "issue_type"),
                        Severity = GetStringProp(item, "severity"),
                        SuggestedRemovedCode = GetNullableStringProp(item, "suggestedRemovedCode", "suggested_removed_code"),
                        SuggestedAddedCode = GetNullableStringProp(item, "suggestedAddedCode", "suggested_added_code")
                    };
                    dto.Issues.Add(comment);
                }
            }

            return dto;
        }
        catch
        {
            return null;
        }
    }

    private static string GetStringProp(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String)
                return prop.GetString() ?? string.Empty;
        }
        return string.Empty;
    }

    private static string? GetNullableStringProp(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.String) return prop.GetString();
                if (prop.ValueKind == JsonValueKind.Null) return null;
            }
        }
        return null;
    }

    private static int GetIntProp(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var prop) && prop.TryGetInt32(out var val))
                return val;
        }
        return 0;
    }
}
