using StudyHub.Common.DTO.AuthDTO;

namespace StudyHub.BLL.Services.Interfaces.Auth;

public interface IGoogleAuthService
{
    Task<AuthSuccessDTO> GoogleRegisterAsync(string authorizationCode, string token);

    Task<AuthSuccessDTO> GoogleLoginAsync(string authorizationCode);
}