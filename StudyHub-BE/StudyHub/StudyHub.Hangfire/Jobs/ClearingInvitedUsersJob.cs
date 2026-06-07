using StudyHub.BLL.Services.Interfaces;
using StudyHub.Hangfire.Abstractions;

namespace StudyHub.Hangfire.Jobs;

public class ClearingInvitedUsersJob : IJob
{
    private readonly IUserInvitationService _userInvitationService;

    public ClearingInvitedUsersJob(IUserInvitationService userInvitationService)
    {
        _userInvitationService = userInvitationService;
    }

    public static string Id => nameof(ClearingInvitedUsersJob);

    public async Task Run(CancellationToken cancellationToken = default) =>
        await _userInvitationService.ClearExpiredInvitationsAsync();

}
