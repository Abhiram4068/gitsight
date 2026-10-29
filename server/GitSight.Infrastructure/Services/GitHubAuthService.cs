using System.Net.Http.Headers;
using System.Text.Json;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Features.Auth.DTOs;
using Microsoft.Extensions.Configuration;
using Octokit;

namespace GitSight.Infrastructure.Services;

public class GitHubAuthService : IGitHubAuthService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public GitHubAuthService(IConfiguration config, HttpClient httpClient)
    {
        _config = config;
        _httpClient = httpClient;
    }

    public string GetAuthorizationUrl(string state, string? prompt = "select_account")
    {
        var clientId = _config["GitHubSettings:ClientId"];
        var redirectUri = _config["GitHubSettings:RedirectUri"];
        var scope = "repo,read:user,user:email";

        var url = $"https://github.com/login/oauth/authorize?client_id={clientId}&redirect_uri={Uri.EscapeDataString(redirectUri!)}&scope={scope}&state={state}";
        if (!string.IsNullOrWhiteSpace(prompt))
        {
            url += $"&prompt={Uri.EscapeDataString(prompt)}";
        }

        return url;
    }

    public async Task<GitHubUserDto> ExchangeCodeForUserAsync(string code)
    {
        var clientId = _config["GitHubSettings:ClientId"];
        var clientSecret = _config["GitHubSettings:ClientSecret"];

        // 1. Exchange OAuth code for GitHub Access Token (server-to-server)
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId!,
            ["client_secret"] = clientSecret!,
            ["code"] = code
        });

        // Github returns the server with an access token
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var jsonDoc = await JsonDocument.ParseAsync(stream);

        if (!jsonDoc.RootElement.TryGetProperty("access_token", out var tokenProp))
        {
            throw new InvalidOperationException("Failed to exchange code for GitHub token.");
        }

        var accessToken = tokenProp.GetString()!;

        // 2. Fetch authenticated profile via Octokit
        var githubClient = new GitHubClient(new Octokit.ProductHeaderValue("GitSight"))
        {
            Credentials = new Credentials(accessToken)
        };

        // Get current user
        var user = await githubClient.User.Current();
        var email = user.Email;

        // If email is private on GitHub profile, fetch verified primary email from /user/emails
        if (string.IsNullOrWhiteSpace(email))
        {
            try
            {
                var emails = await githubClient.User.Email.GetAll();
                email = emails.FirstOrDefault(e => e.Primary && e.Verified)?.Email
                    ?? emails.FirstOrDefault(e => e.Primary)?.Email
                    ?? emails.FirstOrDefault(e => e.Verified)?.Email
                    ?? emails.FirstOrDefault()?.Email;
            }
            catch
            {
                // Fall back gracefully if email endpoint is inaccessible
            }
        }

        return new GitHubUserDto(
            user.Id,
            user.Login,
            email,
            user.AvatarUrl,
            accessToken
        );
    }

    public async Task<string?> GetUserPrimaryEmailAsync(string accessToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken)) return null;

        try
        {
            var githubClient = new GitHubClient(new Octokit.ProductHeaderValue("GitSight"))
            {
                Credentials = new Credentials(accessToken)
            };

            var user = await githubClient.User.Current();
            if (!string.IsNullOrWhiteSpace(user?.Email))
            {
                return user.Email;
            }

            var emails = await githubClient.User.Email.GetAll();
            return emails.FirstOrDefault(e => e.Primary && e.Verified)?.Email
                ?? emails.FirstOrDefault(e => e.Primary)?.Email
                ?? emails.FirstOrDefault(e => e.Verified)?.Email
                ?? emails.FirstOrDefault()?.Email;
        }
        catch
        {
            return null;
        }
    }
}
