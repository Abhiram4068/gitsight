using GitSight.Domain.Entities;

namespace GitSight.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
