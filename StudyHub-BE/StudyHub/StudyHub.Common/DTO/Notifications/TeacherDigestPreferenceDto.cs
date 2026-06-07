namespace StudyHub.Common.DTO.Notifications;

public class TeacherDigestPreferenceDto : NotificationToggleDto
{
    public string Frequency { get; set; } = "daily_digest";
}
