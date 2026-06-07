using StudyHub.Common.DTO.AuthDTO;
using StudyHub.Common.Requests;

namespace StudyHub.BLL.Services.Interfaces.Auth;

public interface IAuthService
{
    Task<AuthSuccessDTO> LoginAsync(LoginUserDTO dto);

    Task<AuthSuccessDTO> RegisterAsync(RegisterUserDTO dto);

    Task<AuthSuccessDTO> RefreshTokenAsync(RefreshTokenRequest request);
}