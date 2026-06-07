using StudyHub.Common.Requests;

namespace StudyHub.BLL.Services.Interfaces.Auth;

public interface IPasswordService
{
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest dto);

    Task<bool> ResetPasswordAsync(ResetPasswordRequest dto);
}