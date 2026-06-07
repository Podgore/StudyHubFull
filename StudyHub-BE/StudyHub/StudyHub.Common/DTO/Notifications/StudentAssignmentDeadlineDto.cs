namespace StudyHub.Common.DTO.Notifications;

public class StudentAssignmentDeadlineDto : NotificationToggleDto
{
    public List<string> Offsets { get; set; } = new() { "P1D", "PT6H" };
}
