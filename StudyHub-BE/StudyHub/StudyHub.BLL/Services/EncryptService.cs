using StudyHub.BLL.Services.Interfaces.Auth;

namespace StudyHub.BLL.Services;

public class EncryptService : IEncryptService
{
    public string Encrypt(string token)
    {
        return BCrypt.Net.BCrypt.EnhancedHashPassword(token);
    }

    public bool Verify(string token, string hash)
    {
        return BCrypt.Net.BCrypt.EnhancedVerify(token, hash);
    }
}
