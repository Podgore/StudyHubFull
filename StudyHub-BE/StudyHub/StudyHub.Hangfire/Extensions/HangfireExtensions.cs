using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using StudyHub.Common.Configs;
using StudyHub.Hangfire.Abstractions;
using StudyHub.Hangfire.Jobs;

namespace StudyHub.Hangfire.Extensions;

public static class HangfireExtensions
{
    public static void SetupHangfire(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;

        var hangfireService = services.GetRequiredService<IHangfireService>();
        var options = services.GetRequiredService<IOptions<HangfireConfig>>();

        hangfireService.SetupRecurring<ClearingInvitedUsersJob>(
            ClearingInvitedUsersJob.Id,
            options.Value.ClearingUserInvitationCron);

        if (!string.IsNullOrWhiteSpace(options.Value.TelegramNotificationsCron))
        {
            hangfireService.SetupRecurring<TelegramNotificationsJob>(
                TelegramNotificationsJob.Id,
                options.Value.TelegramNotificationsCron);
        }

        if (!string.IsNullOrWhiteSpace(options.Value.TelegramDailyDigestCron))
        {
            hangfireService.SetupRecurring<TelegramDailyDigestJob>(
                TelegramDailyDigestJob.Id,
                options.Value.TelegramDailyDigestCron);
        }
    }
}
