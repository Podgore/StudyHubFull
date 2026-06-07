namespace StudyHub.Common.DTO.Notifications;

public class NotificationSettingsResponseDto
{
    public TelegramStatusDto Telegram { get; set; } = new();
    public NotificationPreferencesDto Preferences { get; set; } = new();
}
