namespace StudyHub.BLL.Services.Interfaces.Auth;

public interface IEncryptService
{
    public string Encrypt(string token);
    public bool Verify(string token, string hash);
}
