using StudyHub.Common.DTO;
using StudyHub.Common.DTO.UserInvitation;
using StudyHub.Common.Requests;
using StudyHub.Common.Response;

namespace StudyHub.BLL.Services.Interfaces;

public interface IUserInvitationService
{
    Task ClearExpiredInvitationsAsync();
    Task<StudentResultResponse> InviteManyAsync(Guid userId, InviteUsersRequest dto);
}
