using System.Text;
using FluentValidation;
using GitSight.Api.Middleware;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Configurations;
using GitSight.Application.Services;
using GitSight.Application.Validations;
using GitSight.Infrastructure.Persistence;
using GitSight.Infrastructure.Persistence.Repositories;
using GitSight.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using GitSight.Api.Logging;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
    .Enrich.FromLogContext()
    .Enrich.With(new IstTimestampEnricher())
    .WriteTo.Console(outputTemplate: "[{IstTimestamp} IST] [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/gitsight-log-.txt", rollingInterval: RollingInterval.Day, outputTemplate: "[{IstTimestamp} IST] [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Add Controllers and OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();

// Configure EF Core with PostgreSQL (Neon DB)
var defaultConnectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? builder.Configuration["DATABASE_URL"] 
    ?? string.Empty;

var pgConnectionString = ConvertPostgresUrlToConnectionString(defaultConnectionString);

builder.Services.AddDbContext<GitSightDbContext>(options =>
    options.UseNpgsql(pgConnectionString));

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<GitSightDbContext>());

// Register HttpClients & Infrastructure Services
builder.Services.AddHttpClient<IGitHubAuthService, GitHubAuthService>();
builder.Services.AddHttpClient<IGitHubService, GitHubService>();
builder.Services.AddHttpClient<IAiReviewService, PythonReviewService>(client => 
{
    client.Timeout = TimeSpan.FromMinutes(3);
});

// Register Repositories (Infrastructure)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPullRequestRepository, PullRequestRepository>();
builder.Services.AddScoped<ITrackedIssueRepository, TrackedIssueRepository>();
builder.Services.AddScoped<IRuleRepository, RuleRepository>();


// Register Application & Infrastructure Services
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("SmtpSettings"));
builder.Services.AddScoped<IEmailService, MailKitEmailService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRepositoryService, RepositoryService>();
builder.Services.AddScoped<IPullRequestService, PullRequestService>();
builder.Services.AddScoped<IWebhookService, WebhookService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITrackedIssueService, TrackedIssueService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IRuleService, RuleService>();
builder.Services.AddScoped<IWebhookService, WebhookService>();

// Register FluentValidation Validators
builder.Services.AddValidatorsFromAssemblyContaining<MergePrRequestValidator>();

// JWT Authentication Setup
var jwtKey = builder.Configuration["Jwt:Key"] 
    ?? builder.Configuration["JwtSettings:Key"] 
    ?? "GitSight_Super_Secret_Key_At_Least_32_Characters_Long!";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? builder.Configuration["JwtSettings:Issuer"] ?? "GitSightAuthServer",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? builder.Configuration["JwtSettings:Audience"] ?? "GitSightApiClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS for Vite React Client (Local & Vercel)
var allowedOrigins = new List<string>
{
    "http://localhost:5173",
    "https://usegitsight.vercel.app"
};
var frontendBaseUrl = builder.Configuration["Frontend:BaseUrl"];
if (!string.IsNullOrWhiteSpace(frontendBaseUrl))
{
    allowedOrigins.Add(frontendBaseUrl.TrimEnd('/'));
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins(allowedOrigins.Distinct().ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-initialize schema if using PostgreSQL (Neon DB)
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<GitSightDbContext>();
    if (dbContext.Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true)
    {
        dbContext.Database.EnsureCreated();
    }
}
catch (Exception ex)
{
    Log.Error(ex, "Failed to verify or initialize database schema.");
}

// Custom Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowClient");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

static string ConvertPostgresUrlToConnectionString(string urlOrConnStr)
{
    if (string.IsNullOrWhiteSpace(urlOrConnStr)) return urlOrConnStr;

    if (urlOrConnStr.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
        urlOrConnStr.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        var uri = new Uri(urlOrConnStr);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
    }

    return urlOrConnStr;
}
