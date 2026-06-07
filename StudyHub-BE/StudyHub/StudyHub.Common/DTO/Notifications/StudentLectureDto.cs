namespace StudyHub.Common.DTO.Notifications;

public class StudentLectureDto : NotificationToggleDto
{
    public string NotifyOn { get; set; } = "both";
    public string Frequency { get; set; } = "instant";
}
