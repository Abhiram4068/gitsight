using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Configurations;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GitSight.Infrastructure.Services;

public class GeminiService : IAiReviewService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private readonly ILogger<GeminiService> _logger;

    private const int MaxChunkSize = 15000;
    private const int MaxTotalChunks = 5;

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

    public GeminiService(HttpClient httpClient, IConfiguration config, ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _settings = config.GetSection("GeminiSettings").Get<GeminiSettings>() ?? new GeminiSettings
        {
            ApiKey = config["GeminiSettings:ApiKey"] ?? config["Gemini:ApiKey"] ?? string.Empty,
            Model = config["GeminiSettings:Model"] ?? config["Gemini:Model"] ?? "gemini-3.8-flash"
        };
        _logger = logger;
    }

    public async Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null)
    {
        _logger.LogInformation("Starting AI Diff analysis. PR Title: {PrTitle}, Diff length: {DiffLength}", prTitle, diffText.Length);
        
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            _logger.LogError("Gemini API key is not configured.");
            throw new InvalidOperationException("Gemini API key is not configured. Please set GeminiSettings:ApiKey in appsettings.json or user-secrets.");
        }

        var rawFiles = diffText.Split(new[] { "diff --git" }, StringSplitOptions.RemoveEmptyEntries);
        var relevantFiles = new List<string>();

        foreach (var file in rawFiles)
        {
            var firstLineEnd = file.IndexOf('\n');
            var header = firstLineEnd > 0 ? file.Substring(0, firstLineEnd) : file;

            bool isNoise = NoiseFilePatterns.Any(pattern => header.Contains(pattern, StringComparison.OrdinalIgnoreCase));
            if (isNoise)
            {
                _logger.LogInformation("Skipping generated/noise file in diff: {Header}", header.Trim());
                continue;
            }

            var content = "diff --git" + file;
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

        // If all files were filtered as noise, retain at least a summary chunk of the first relevant raw file
        if (chunks.Count == 0 && rawFiles.Length > 0)
        {
            chunks.Add("diff --git" + (rawFiles[0].Length > 5000 ? rawFiles[0].Substring(0, 5000) : rawFiles[0]));
        }

        var masterResult = new GeminiReviewResultDto
        {
            Issues = new List<GeminiInlineCommentDto>()
        };
        var summaries = new StringBuilder();

        for (int i = 0; i < chunks.Count; i++)
        {
            var chunkTitle = $"PULL REQUEST TITLE: {prTitle} (Part {i + 1} of {chunks.Count})";
            var chunkResult = await AnalyzeChunkAsync(chunks[i], chunkTitle, prDescription);

            summaries.AppendLine(chunkResult.ExecutiveSummary);
            masterResult.SyntaxErrorsCount += chunkResult.SyntaxErrorsCount;
            masterResult.SecurityIssuesCount += chunkResult.SecurityIssuesCount;
            masterResult.BreachesCount += chunkResult.BreachesCount;
            masterResult.PerformanceIssuesCount += chunkResult.PerformanceIssuesCount;
            masterResult.CodeSmellsCount += chunkResult.CodeSmellsCount;

            if (chunkResult.Issues != null)
            {
                masterResult.Issues.AddRange(chunkResult.Issues);
            }

            masterResult.OverallConfidenceScore += chunkResult.OverallConfidenceScore;
        }

        if (chunks.Count > 0)
        {
            masterResult.OverallConfidenceScore /= chunks.Count;
        }

        masterResult.FinalSuggestionsCount = masterResult.Issues.Count;
        masterResult.ExecutiveSummary = summaries.ToString().Trim();

        _logger.LogInformation("Completed Gemini AI Diff analysis. Extracted {TotalIssues} total issues across {ChunkCount} chunks.", masterResult.Issues.Count, chunks.Count);

        return masterResult;
    }

    private async Task<GeminiReviewResultDto> AnalyzeChunkAsync(string diffChunk, string prTitle, string? prDescription)
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
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = $"{systemPrompt}\n\n{userMessage}" }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.2,
                responseMimeType = "application/json"
            }
        };

        var primaryModel = string.IsNullOrWhiteSpace(_settings.Model) ? "gemini-3.8-flash" : _settings.Model;
        var modelsToTry = new[] { primaryModel, "gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest" }
            .Distinct()
            .ToArray();
        
        HttpResponseMessage? response = null;
        string currentModel = primaryModel;
        
        for (int i = 0; i < modelsToTry.Length; i++)
        {
            currentModel = modelsToTry[i];
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{currentModel}:generateContent?key={_settings.ApiKey}";
            
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            response = await _httpClient.SendAsync(request);
            
            if (response.IsSuccessStatusCode)
            {
                break;
            }
            
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Gemini API call to {Model} returned {StatusCode}: {Error}", currentModel, response.StatusCode, err);

            if (i == modelsToTry.Length - 1)
            {
                throw new HttpRequestException($"Failed to analyze diff with Gemini API. Exhausted all fallback models. Last error ({currentModel}): {response.StatusCode} - {err}");
            }
        }

        var json = await response!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        
        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("Empty response received from Gemini.");
        }

        var cleanedText = text.Trim();
        if (cleanedText.StartsWith("```json")) cleanedText = cleanedText.Substring(7);
        if (cleanedText.StartsWith("```")) cleanedText = cleanedText.Substring(3);
        if (cleanedText.EndsWith("```")) cleanedText = cleanedText.Substring(0, cleanedText.Length - 3);
        cleanedText = cleanedText.Trim();

        var result = JsonSerializer.Deserialize<GeminiReviewResultDto>(cleanedText, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (result == null)
        {
            throw new InvalidOperationException("Failed to deserialize Gemini output.");
        }

        result.Issues ??= new List<GeminiInlineCommentDto>();

        // Normalize counts to match parsed issues
        result.FinalSuggestionsCount = result.Issues.Count;
        result.SecurityIssuesCount = result.Issues.Count(i => i.IssueType.Equals("Security", StringComparison.OrdinalIgnoreCase));
        result.BreachesCount = result.Issues.Count(i => i.IssueType.Equals("Breach", StringComparison.OrdinalIgnoreCase));
        result.PerformanceIssuesCount = result.Issues.Count(i => i.IssueType.Equals("Performance", StringComparison.OrdinalIgnoreCase));
        result.CodeSmellsCount = result.Issues.Count(i => i.IssueType.Equals("CodeSmell", StringComparison.OrdinalIgnoreCase));

        _logger.LogInformation("Gemini model {Model} successfully extracted {Count} issues for chunk.", currentModel, result.Issues.Count);

        return result;
    }
}
