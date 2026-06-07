using StudyHub.BLL.Services.Interfaces;
using StudyHub.Hangfire.Abstractions;

namespace StudyHub.Hangfire.Jobs;

public class TelegramDailyDigestJob : IJob
{
    private readonly INotificationDispatchService _dispatch;

    public TelegramDailyDigestJob(INotificationDispatchService dispatch)
    {
        _dispatch = dispatch;
    }

    public static string Id => nameof(TelegramDailyDigestJob);

    public Task Run(CancellationToken cancellationToken = default) =>
        _dispatch.RunDailyDigestNotificationsAsync(cancellationToken);
}
