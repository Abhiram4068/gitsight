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

    // Maximum allowed character length for each diff chunk block.
    private const int MaxChunkSize = 15000;

    public async Task<GeminiReviewResultDto> AnalyzeDiffAsync(string diffText, string prTitle, string? prDescription = null)
    {
        // Ensure that the Gemini API key is properly configured.
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            // Throw an exception if the API key is missing.
            throw new InvalidOperationException("Gemini API key is not configured. Please set GeminiSettings:ApiKey in appsettings.json.");
        }

        // Split the entire diff string by the git diff header.
        var files = diffText.Split(new[] { "diff --git" }, StringSplitOptions.RemoveEmptyEntries);
        // List to hold our dynamically created diff chunk strings.
        var chunks = new List<string>();
        // StringBuilder to actively build the current diff chunk safely.
        var currentChunk = new StringBuilder();

        // Loop through each separated file from the parsed diff.
        foreach (var file in files)
        {
            // Reattach the git header that was removed by splitting.
            var fileContent = "diff --git" + file;
            
            // Check if adding this file exceeds the maximum chunk size.
            if (currentChunk.Length + fileContent.Length > MaxChunkSize && currentChunk.Length > 0)
            {
                // Add the completed chunk to the final chunk list.
                chunks.Add(currentChunk.ToString());
                // Clear the string builder to start a new chunk.
                currentChunk.Clear();
            }
            
            // Append the current file content to the active chunk.
            currentChunk.AppendLine(fileContent);
        }

        // Add any remaining content in the string builder to chunks.
        if (currentChunk.Length > 0)
        {
            // Finalize the last chunk and add it to list.
            chunks.Add(currentChunk.ToString());
        }

        // Initialize the master result object to aggregate chunk results.
        var masterResult = new GeminiReviewResultDto
        {
            // Initialize the issues list to prevent null reference errors.
            Issues = new List<AiReviewIssueDto>()
        };
        // Use a string builder to aggregate the executive summaries efficiently.
        var summaries = new StringBuilder();

        // Loop through each chunk and process it with the AI.
        for (int i = 0; i < chunks.Count; i++)
        {
            // Create a clear indicator of which chunk is processing.
            var chunkTitle = $"PULL REQUEST TITLE: {prTitle} (Part {i + 1} of {chunks.Count})";
            // Call the helper method to get the AI analysis chunk.
            var chunkResult = await AnalyzeChunkAsync(chunks[i], chunkTitle, prDescription);

            // Accumulate the executive summary from the current chunk result.
            summaries.AppendLine(chunkResult.ExecutiveSummary);
            // Add the chunk's syntax errors count to the master total.
            masterResult.SyntaxErrorsCount += chunkResult.SyntaxErrorsCount;
            // Add the chunk's security issues count to the master total.
            masterResult.SecurityIssuesCount += chunkResult.SecurityIssuesCount;
            // Add the chunk's breaches count to the master total.
            masterResult.BreachesCount += chunkResult.BreachesCount;
            // Add the chunk's performance issues count to the master total.
            masterResult.PerformanceIssuesCount += chunkResult.PerformanceIssuesCount;
            // Add the chunk's code smells count to the master total.
            masterResult.CodeSmellsCount += chunkResult.CodeSmellsCount;
            // Add the chunk's final suggestions count to the master total.
            masterResult.FinalSuggestionsCount += chunkResult.FinalSuggestionsCount;

            // Ensure the chunk actually returned issues before adding them.
            if (chunkResult.Issues != null)
            {
                // Add all issues from the chunk to the master list.
                masterResult.Issues.AddRange(chunkResult.Issues);
            }

            // Keep a running sum of the overall confidence scores temporarily.
            masterResult.OverallConfidenceScore += chunkResult.OverallConfidenceScore;
        }

        // Average the overall confidence score across all processed chunks safely.
        if (chunks.Count > 0)
        {
            // Divide the total score by the number of chunks processed.
            masterResult.OverallConfidenceScore /= chunks.Count;
        }

        // Set the master executive summary from the accumulated string builder.
        masterResult.ExecutiveSummary = summaries.ToString();

        // Return the final aggregated review result to the caller.
        return masterResult;
    }

    private async Task<GeminiReviewResultDto> AnalyzeChunkAsync(string diffChunk, string prTitle, string? prDescription)
    {
        // Load the system prompt from the predefined application prompts class.
        var systemPrompt = GeminiPrompts.SystemPrompt;

        // Construct the user message containing title, description, and diff.
        var userMessage = $"""
        PULL REQUEST TITLE: {prTitle}
        PULL REQUEST DESCRIPTION: {prDescription ?? "No description provided."}

        UNIFIED DIFF:
        {diffChunk}
        """;

        // Create the JSON payload object expected by the Gemini API.
        var payload = new
        {
            // Define the contents array required for the request body.
            contents = new[]
            {
                // Create an anonymous object for the message parts array.
                new
                {
                    // Define the parts array containing the text prompt.
                    parts = new[]
                    {
                        // Combine the system prompt and user message together.
                        new { text = $"{systemPrompt}\n\n{userMessage}" }
                    }
                }
            },
            // Specify the generation configuration for the API request.
            generationConfig = new
            {
                // Set the temperature to zero point two for deterministic output.
                temperature = 0.2,
                // Request that the model returns the response as JSON format.
                responseMimeType = "application/json"
            }
        };

        // Determine the primary model to use from the application settings.
        var primaryModel = string.IsNullOrEmpty(_settings.Model) ? "gemini-3.1-flash-lite" : _settings.Model;
        // Define the array of models to try in fallback order.
        var modelsToTry = new[] { primaryModel, "gemini-3-flash-preview" }; 
        
        // Declare the HTTP response message variable to hold the response.
        HttpResponseMessage response = null;
        // Keep track of the current model being tested during iteration.
        string currentModel = primaryModel;
        
        // Loop through the models to attempt the request with fallbacks.
        for (int i = 0; i < modelsToTry.Length; i++)
        {
            // Update the current model to the model in the loop.
            currentModel = modelsToTry[i];
            // Construct the full URL endpoint for the current Gemini model.
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{currentModel}:generateContent?key={_settings.ApiKey}";
            
            // Create a new HTTP POST request message for the endpoint.
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            // Serialize the payload to JSON and attach as request content.
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            // Send the asynchronous HTTP request to the Gemini API endpoint.
            response = await _httpClient.SendAsync(request);
            
            // Check if the HTTP response indicates a successful status code.
            if (response.IsSuccessStatusCode)
            {
                // Exit the fallback loop since the request was entirely successful.
                break;
            }
            
            // Check if we have exhausted the last available fallback model option.
            if (i == modelsToTry.Length - 1)
            {
                // Read the error message content from the failed HTTP response.
                var err = await response.Content.ReadAsStringAsync();
                // Throw an exception detailing the exhausted models and last error.
                throw new HttpRequestException($"Failed to analyze diff with Gemini API. Exhausted all fallback models. Last error ({currentModel}): {response.StatusCode} - {err}");
            }
        }

        // Read the successful JSON response content from the HTTP response.
        var json = await response.Content.ReadAsStringAsync();
        // Parse the JSON string into a structured JsonDocument for traversal.
        using var doc = JsonDocument.Parse(json);
        
        // Extract the generated text from the deeply nested JSON structure.
        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        // Validate that the extracted text is not null or completely empty.
        if (string.IsNullOrWhiteSpace(text))
        {
            // Throw an exception if the model returned an empty string response.
            throw new InvalidOperationException("Empty response received from Gemini.");
        }

        // Trim any leading or trailing whitespace from the extracted text.
        var cleanedText = text.Trim();
        // Remove markdown JSON code blocks from the beginning if they exist.
        if (cleanedText.StartsWith("```json")) cleanedText = cleanedText.Substring(7);
        // Remove generic markdown code blocks from the beginning if they exist.
        if (cleanedText.StartsWith("```")) cleanedText = cleanedText.Substring(3);
        // Remove markdown code blocks from the end if they are present.
        if (cleanedText.EndsWith("```")) cleanedText = cleanedText.Substring(0, cleanedText.Length - 3);
        // Perform a final trim to ensure all whitespace is perfectly clean.
        cleanedText = cleanedText.Trim();

        // Deserialize the cleaned JSON string into the required DTO structure.
        var result = JsonSerializer.Deserialize<GeminiReviewResultDto>(cleanedText, new JsonSerializerOptions
        {
            // Make the JSON property name matching case insensitive for safety.
            PropertyNameCaseInsensitive = true
        });

        // Return the successfully deserialized object or throw an error immediately.
        return result ?? throw new InvalidOperationException("Failed to deserialize Gemini output.");
    }
}
