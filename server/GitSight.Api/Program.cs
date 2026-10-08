using System.Text;
using FluentValidation;
using GitSight.Api.Middleware;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Services;
using GitSight.Application.Validations;
using GitSight.Infrastructure.Persistence;
using GitSight.Infrastructure.Persistence.Repositories;
using GitSight.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers and OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();

// Configure EF Core with SQL Server 2022
builder.Services.AddDbContext<GitSightDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<GitSightDbContext>());

// Register HttpClients & Infrastructure Services
builder.Services.AddHttpClient<IGitHubAuthService, GitHubAuthService>();
builder.Services.AddHttpClient<IGitHubService, GitHubService>();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();

// Register Repositories (Infrastructure)
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Register Application & Infrastructure Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRepositoryService, RepositoryService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

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

// CORS for Vite React Client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

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

app.Run();
