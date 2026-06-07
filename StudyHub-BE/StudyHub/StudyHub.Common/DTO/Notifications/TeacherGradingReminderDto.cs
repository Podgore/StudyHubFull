namespace StudyHub.Common.DTO.Notifications;

public class TeacherGradingReminderDto : NotificationToggleDto
{
    public string Frequency { get; set; } = "daily_pending";
}
