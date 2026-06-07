using Hangfire;
using StudyHub.Hangfire.Abstractions;

namespace StudyHub.Hangfire.Services;

public class HangfireService : IHangfireService
{
    private static readonly RecurringJobOptions _recurringJobOptions = new()
    {
        TimeZone = TimeZoneInfo.Local
    };

    public bool Delete(string jobId)
    {
        return BackgroundJob.Delete(jobId);
    }

    public string Enqueue<T>(CancellationToken cancellationToken = default)
        where T : IJob
    {
        return BackgroundJob.Enqueue((T j) => j.Run(cancellationToken));
    }

    public string Enqueue<T, TA>(TA args, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        return BackgroundJob.Enqueue((T j) => j.Run(args, cancellationToken));
    }

    public string Schedule<T>(TimeSpan delay, CancellationToken cancellationToken = default)
        where T : IJob
    {
        return BackgroundJob.Schedule((T j) => j.Run(cancellationToken), delay);
    }

    public string Schedule<T, TA>(TA args, TimeSpan delay, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        return BackgroundJob.Schedule((T j) => j.Run(args, cancellationToken), delay);
    }

    public string Schedule<T>(DateTimeOffset enqueueAt, CancellationToken cancellationToken = default)
        where T : IJob
    {
        return BackgroundJob.Schedule((T j) => j.Run(cancellationToken), enqueueAt);
    }

    public string Schedule<T, TA>(TA args, DateTimeOffset enqueueAt, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        return BackgroundJob.Schedule((T j) => j.Run(args, cancellationToken), enqueueAt);
    }

    public void SetupRecurring<T>(string id, string cron, CancellationToken cancellationToken = default)
        where T : IJob
    {
        RecurringJob.AddOrUpdate(id, (T j) => j.Run(cancellationToken), cron, _recurringJobOptions);
    }

    public void SetupRecurring<T, TA>(string id, TA args, string cron, CancellationToken cancellationToken = default)
        where T : IJob<TA>
        where TA : IJobArgs
    {
        RecurringJob.AddOrUpdate(id, (T j) => j.Run(args, cancellationToken), cron, _recurringJobOptions);
    }
}