namespace StudyHub.Common.DTO.Notifications;

public class StudentNewContentDto : NotificationToggleDto
{
    public string NotifyOn { get; set; } = "published";
    public string Frequency { get; set; } = "instant";
}
