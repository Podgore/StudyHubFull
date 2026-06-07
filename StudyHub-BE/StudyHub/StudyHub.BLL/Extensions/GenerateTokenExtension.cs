using System.Security.Cryptography;

namespace StudyHub.BLL.Extensions;

public static class GenerateTokenExtension
{
    public static string GenerateToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
}
