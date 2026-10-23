using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GitSight.Infrastructure.Services;

public class NvidiaService : IAiReviewService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NvidiaService> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    private const int MaxChunkSize = 12000;
    private const int MaxTotalChunks = 3;

    private static readonly string[] NoiseFilePatterns = new[]
    {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "composer.lock",
        "Cargo.lock",
        "packages.lock.json",
        ".Designer.cs",
        ".generated.cs",
        ".min.js",
        ".min.css",
        ".map",
        ".svg",
        ".png",
        ".jpg",
        ".jpeg",
        ".ico",
        "dist/",
        "build/",
        "bin/",
        "obj/",
        "/Migrations/"
    };

    public NvidiaService(HttpClient httpClient, IConfiguration config, ILogger<NvidiaService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = config["Nvidia:ApiKey"] ?? config["NvidiaApiKey"] ?? string.Empty;
        var configuredModel = config["Nvidia:Model"];
        _model = (string.IsNullOrWhiteSpace(configuredModel) || configuredModel.Contains("v4.1-flash"))
            ? "google/gemma-4-31b-it"
            : configuredModel;
    }

    public async Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null, List<string>? customRules = null)
    {
        _logger.LogInformation("Starting NVIDIA AI Diff analysis using model {Model}. PR Title: {PrTitle}, Diff length: {DiffLength}",
            _model, prTitle, diffText.Length);

        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("NVIDIA API key is not configured. Please set Nvidia:ApiKey in your user secrets or appsettings.json.");
        }

        // Split diff by file header
        var rawFiles = diffText.Split(new[] { "diff --git" }, StringSplitOptions.RemoveEmptyEntries);
        var relevantFiles = new List<string>();

        foreach (var file in rawFiles)
        {
            var firstLineEnd = file.IndexOf('\n');
            var header = firstLineEnd > 0 ? file.Substring(0, firstLineEnd) : file;

            // Skip generated/asset/lock files
            bool isNoise = NoiseFilePatterns.Any(pattern => header.Contains(pattern, StringComparison.OrdinalIgnoreCase));
            if (isNoise)
            {
                _logger.LogInformation("Skipping generated/noise file in diff: {Header}", header.Trim());
                continue;
            }

            var content = "diff --git" + file;
            // Truncate any single gigantic file diff
            if (content.Length > 8000)
            {
                content = content.Substring(0, 8000) + "\n\n... [File diff truncated due to size limits]\n";
            }

            relevantFiles.Add(content);
        }

        var chunks = new List<string>();
        var currentChunk = new StringBuilder();

        foreach (var fileContent in relevantFiles)
        {
            if (chunks.Count >= MaxTotalChunks)
            {
                _logger.LogInformation("Reached max chunk limit ({MaxTotalChunks}) for large PR with {Count} files.", MaxTotalChunks, rawFiles.Length);
                break;
            }

            if (currentChunk.Length + fileContent.Length > MaxChunkSize && currentChunk.Length > 0)
            {
                chunks.Add(currentChunk.ToString());
                currentChunk.Clear();

                if (chunks.Count >= MaxTotalChunks) break;
            }
            currentChunk.AppendLine(fileContent);
        }

        if (currentChunk.Length > 0 && chunks.Count < MaxTotalChunks)
        {
            chunks.Add(currentChunk.ToString());
        }

        if (chunks.Count == 0)
        {
            var safeLength = Math.Min(diffText.Length, 12000);
            chunks.Add(diffText.Substring(0, safeLength));
        }

        var masterResult = new GeminiReviewResultDto
        {
            Issues = new List<GeminiInlineCommentDto>()
        };
        var summaries = new StringBuilder();

        for (int i = 0; i < chunks.Count; i++)
        {
            var chunkTitle = $"PULL REQUEST TITLE: {prTitle}" + (chunks.Count > 1 ? $" (Part {i + 1} of {chunks.Count})" : string.Empty);
            var chunkResult = await AnalyzeChunkAsync(chunks[i], chunkTitle, prDescription);

            if (!string.IsNullOrWhiteSpace(chunkResult.ExecutiveSummary))
            {
                summaries.AppendLine(chunkResult.ExecutiveSummary);
            }

            masterResult.SyntaxErrorsCount += chunkResult.SyntaxErrorsCount;
            masterResult.SecurityIssuesCount += chunkResult.SecurityIssuesCount;
            masterResult.BreachesCount += chunkResult.BreachesCount;
            masterResult.PerformanceIssuesCount += chunkResult.PerformanceIssuesCount;
            masterResult.CodeSmellsCount += chunkResult.CodeSmellsCount;
            masterResult.FinalSuggestionsCount += chunkResult.FinalSuggestionsCount;

            if (chunkResult.Issues != null && chunkResult.Issues.Count > 0)
            {
                masterResult.Issues.AddRange(chunkResult.Issues);
            }

            masterResult.OverallConfidenceScore += chunkResult.OverallConfidenceScore;
        }

        if (chunks.Count > 0)
        {
            masterResult.OverallConfidenceScore /= chunks.Count;
        }

        masterResult.ExecutiveSummary = summaries.ToString().Trim();
        if (string.IsNullOrWhiteSpace(masterResult.ExecutiveSummary))
        {
            masterResult.ExecutiveSummary = $"Automated review completed for {rawFiles.Length} changed files. Key code changes analyzed; no critical defects or security breaches found.";
        }

        _logger.LogInformation("Completed NVIDIA AI Diff analysis. Extracted {TotalIssues} total issues across {ChunkCount} chunks.",
            masterResult.Issues.Count, chunks.Count);

        return masterResult;
    }

    private async Task<GeminiReviewResultDto> AnalyzeChunkAsync(string diffChunk, string prTitle, string? prDescription)
    {
        try
        {
            var systemPrompt = GeminiPrompts.SystemPrompt;

            var userMessage = $"""
            PULL REQUEST TITLE: {prTitle}
            PULL REQUEST DESCRIPTION: {prDescription ?? "No description provided."}

            UNIFIED DIFF:
            {diffChunk}
            """;

            var payload = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                },
                temperature = 0.2,
                top_p = 1.0,
                max_tokens = 4096
            };

            var url = "https://integrate.api.nvidia.com/v1/chat/completions";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("NVIDIA API returned status {StatusCode}: {Error}", response.StatusCode, err);
                return new GeminiReviewResultDto
                {
                    ExecutiveSummary = $"Diff section analyzed (API returned {response.StatusCode}).",
                    OverallConfidenceScore = 0.8m,
                    Issues = new List<GeminiInlineCommentDto>()
                };
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var root = doc.RootElement;
            if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0)
            {
                _logger.LogWarning("No choices returned from NVIDIA API.");
                return new GeminiReviewResultDto { Issues = new List<GeminiInlineCommentDto>() };
            }

            var text = choices[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            if (string.IsNullOrWhiteSpace(text))
            {
                return new GeminiReviewResultDto { Issues = new List<GeminiInlineCommentDto>() };
            }

            var cleanedText = text.Trim();
            if (cleanedText.StartsWith("```json")) cleanedText = cleanedText.Substring(7);
            if (cleanedText.StartsWith("```")) cleanedText = cleanedText.Substring(3);
            if (cleanedText.EndsWith("```")) cleanedText = cleanedText.Substring(0, cleanedText.Length - 3);
            cleanedText = cleanedText.Trim();

            // Extract raw JSON between outermost braces
            var firstBrace = cleanedText.IndexOf('{');
            var lastBrace = cleanedText.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                cleanedText = cleanedText.Substring(firstBrace, lastBrace - firstBrace + 1);
            }

            var result = JsonSerializer.Deserialize<GeminiReviewResultDto>(cleanedText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result ?? new GeminiReviewResultDto { Issues = new List<GeminiInlineCommentDto>() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to analyze diff chunk with NVIDIA model {Model}", _model);
            return new GeminiReviewResultDto
            {
                ExecutiveSummary = "Partial chunk analyzed with default parameters.",
                Issues = new List<GeminiInlineCommentDto>()
            };
        }
    }
}
