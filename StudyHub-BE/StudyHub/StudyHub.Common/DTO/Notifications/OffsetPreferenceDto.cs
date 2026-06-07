namespace StudyHub.Common.DTO.Notifications;

public class OffsetPreferenceDto : NotificationToggleDto
{
    public List<string> Offsets { get; set; } = new();
}
