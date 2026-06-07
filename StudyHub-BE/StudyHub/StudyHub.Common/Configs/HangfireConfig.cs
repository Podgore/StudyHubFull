namespace StudyHub.Common.Configs;

public class HangfireConfig : ConfigBase
{
    public string ClearingUserInvitationCron { get; set; } = string.Empty;
    public string TelegramNotificationsCron { get; set; } = "*/10 * * * *";
    public string TelegramDailyDigestCron { get; set; } = "0 8 * * *";
}