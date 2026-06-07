namespace StudyHub.Common.DTO.Notifications;

public class UpdateNotificationSettingsRequestDto
{
    public NotificationPreferencesDto Preferences { get; set; } = new();
}
