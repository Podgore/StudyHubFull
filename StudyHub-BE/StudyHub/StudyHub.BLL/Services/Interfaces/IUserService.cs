using Microsoft.AspNetCore.Http;
using StudyHub.Common.DTO.User;
using StudyHub.Common.DTO.User.Student;
using StudyHub.Common.DTO.UserInvitation;
using StudyHub.Common.Requests;
using StudyHub.Common.Response;

namespace StudyHub.BLL.Services.Interfaces;

public interface IUserService
{
    Task<PageList<StudentDTO>> GetStudentsAsync(SearchRequest request);
    Task<UserDTO> UpdateUserAsync(Guid userId, UpdateUserDTO dto);
    Task<AvatarResponse> UploadAvatarAsync(Guid userId, IFormFile avatar);
    bool DeleteAvatar(Guid userId);
    Task<UserDTO> GetUserAsync(Guid userId);
}
