using StudyHub.Entities;
using System.Security.Claims;

namespace StudyHub.BLL.Services.Interfaces.Auth;

public interface ITokenService
{
    Task<string> GenerateJwtTokenAsync(User user);
    Task<string> GenerateRefreshTokenAsync(User user);

    ClaimsPrincipal GetPrincipalFromToken(string token);
}