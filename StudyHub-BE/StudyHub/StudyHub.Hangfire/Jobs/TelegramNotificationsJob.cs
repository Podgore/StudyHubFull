using StudyHub.BLL.Services.Interfaces;
using StudyHub.Hangfire.Abstractions;

namespace StudyHub.Hangfire.Jobs;

public class TelegramNotificationsJob : IJob
{
    private readonly INotificationDispatchService _dispatch;

    public TelegramNotificationsJob(INotificationDispatchService dispatch)
    {
        _dispatch = dispatch;
    }

    public static string Id => nameof(TelegramNotificationsJob);

    public Task Run(CancellationToken cancellationToken = default) =>
        _dispatch.RunScheduledNotificationsAsync(cancellationToken);
}
