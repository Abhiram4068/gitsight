using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Configuration;

namespace GitSight.Infrastructure.Services;

public class NvidiaService : IAiReviewService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;

    public NvidiaService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Nvidia:ApiKey"] ?? string.Empty;
        _model = config["Nvidia:Model"] ?? "deepseek-ai/deepseek-v4.1-flash";
    }

    public async Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("NVIDIA API key is not configured. Please set Nvidia:ApiKey in your secrets.");
        }

        var systemPrompt = GeminiPrompts.SystemPrompt;

        var userMessage = $"""
        PULL REQUEST TITLE: {prTitle}
        PULL REQUEST DESCRIPTION: {prDescription ?? "No description provided."}

        UNIFIED DIFF:
        {diffText}
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
            max_tokens = 4000
        };

        var url = "https://integrate.api.nvidia.com/v1/chat/completions";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Failed to analyze diff with NVIDIA API: {response.StatusCode} - {err}");
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        
        var text = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("Empty response received from NVIDIA.");
        }

        // Clean any accidental markdown backticks (Llama/Nemotron might wrap the JSON response)
        var cleanedText = text.Trim();
        if (cleanedText.StartsWith("```json")) cleanedText = cleanedText.Substring(7);
        if (cleanedText.StartsWith("```")) cleanedText = cleanedText.Substring(3);
        if (cleanedText.EndsWith("```")) cleanedText = cleanedText.Substring(0, cleanedText.Length - 3);
        cleanedText = cleanedText.Trim();

        var result = JsonSerializer.Deserialize<GeminiReviewResultDto>(cleanedText, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? throw new InvalidOperationException("Failed to deserialize NVIDIA AI output.");
    }
}
