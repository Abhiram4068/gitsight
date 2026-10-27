namespace GitSight.Application.DTOs;

public class WebhookResultDto
{
    public bool Processed { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }

    public static WebhookResultDto Ignored(string data, string message) =>
        new()
        {
            Processed = false,
            Status = "ignored",
            Message = message,
            Data = data
        };

    public static WebhookResultDto Skipped(string data, string message) =>
        new()
        {
            Processed = false,
            Status = "skipped",
            Message = message,
            Data = data
        };

    public static WebhookResultDto Success(object data, string message) =>
        new()
        {
            Processed = true,
            Status = "processed",
            Message = message,
            Data = data
        };
}

public class GitHubWebhookValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public int StatusCode { get; set; } = 400;

    public static GitHubWebhookValidationResult Valid() =>
        new() { IsValid = true };

    public static GitHubWebhookValidationResult Invalid(string message, int statusCode = 400) =>
        new() { IsValid = false, ErrorMessage = message, StatusCode = statusCode };
}
