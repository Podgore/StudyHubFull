namespace StudyHub.Common.DTO.Notifications;

public class NotificationPreferencesDto
{
    public int Version { get; set; } = 1;
    public TeacherNotificationPreferencesDto Teacher { get; set; } = new();
    public StudentNotificationPreferencesDto Student { get; set; } = new();
}
