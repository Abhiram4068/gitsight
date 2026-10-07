using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GitSight.Application.Common.Interfaces;
using GitSight.Application.Configurations;
using GitSight.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GitSight.Application.Services;

public class JwtService : IJwtService
{
    private readonly JwtSettings _jwtSettings;

    public JwtService(IConfiguration configuration)
    {
        _jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>() 
            ?? configuration.GetSection("JwtSettings").Get<JwtSettings>() 
            ?? new JwtSettings
            {
                Key = configuration["Jwt:Key"] ?? "GitSight_Super_Secret_Key_At_Least_32_Characters_Long!",
                Issuer = configuration["Jwt:Issuer"] ?? "GitSightAuthServer",
                Audience = configuration["Jwt:Audience"] ?? "GitSightApiClient",
                ExpiryDays = 7
            };
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim("github_id", user.GitHubId.ToString()),
            new Claim("github_access_token", user.AccessToken),
            new Claim(ClaimTypes.Role, ((int)user.Role).ToString()),
            new Claim("token_type", "access"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(_jwtSettings.ExpiryDays > 0 ? _jwtSettings.ExpiryDays : 7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
