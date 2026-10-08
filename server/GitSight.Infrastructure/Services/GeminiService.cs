using System.Text;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Configurations;
using GitSight.Application.DTOs;
using Microsoft.Extensions.Configuration;

namespace GitSight.Infrastructure.Services;

public class GeminiService : IAiReviewService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;

    public GeminiService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _settings = config.GetSection("GeminiSettings").Get<GeminiSettings>() ?? new GeminiSettings
        {
            ApiKey = config["Gemini:ApiKey"] ?? string.Empty,
            Model = config["Gemini:Model"] ?? "gemini-3.8-flash"
        };
    }

    public async Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured. Please set GeminiSettings:ApiKey in appsettings.json.");
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

        var model = string.IsNullOrEmpty(_settings.Model) ? "gemini-3.8-flash" : _settings.Model;
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={_settings.ApiKey}";

        HttpResponseMessage response = null;
        int maxRetries = 3;
        
        for (int i = 0; i < maxRetries; i++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            response = await _httpClient.SendAsync(request);
            
            if (response.IsSuccessStatusCode)
            {
                break; // Success! Exit the retry loop.
            }
            
            // If it's a 429 (Too Many Requests) or a 500+ (Traffic/Service Unavailable), wait and retry
            if ((int)response.StatusCode == 429 || (int)response.StatusCode >= 500)
            {
                if (i == maxRetries - 1)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    throw new HttpRequestException($"Gemini API overloaded. Failed after {maxRetries} retries: {response.StatusCode} - {err}");
                }
                
                // Exponential backoff: Wait 2s, then 4s, then 8s
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, i + 1)));
            }
            else
            {
                // Unrecoverable error (like 400 Bad Request, 401 Unauthorized)
                var err = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Failed to analyze diff with Gemini API: {response.StatusCode} - {err}");
            }
        }

        var json = await response.Content.ReadAsStringAsync();
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

        // Clean any accidental markdown backticks
        var cleanedText = text.Trim();
        if (cleanedText.StartsWith("```json")) cleanedText = cleanedText.Substring(7);
        if (cleanedText.StartsWith("```")) cleanedText = cleanedText.Substring(3);
        if (cleanedText.EndsWith("```")) cleanedText = cleanedText.Substring(0, cleanedText.Length - 3);
        cleanedText = cleanedText.Trim();

        var result = JsonSerializer.Deserialize<GeminiReviewResultDto>(cleanedText, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? throw new InvalidOperationException("Failed to deserialize Gemini output.");
    }
}
