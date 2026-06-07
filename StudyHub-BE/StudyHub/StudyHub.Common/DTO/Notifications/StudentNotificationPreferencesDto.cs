namespace StudyHub.Common.DTO.Notifications;

public class StudentNotificationPreferencesDto
{
    public StudentLectureDto NewLecture { get; set; } = new();
    public StudentNewContentDto NewAssignment { get; set; } = new();
    public StudentAssignmentDeadlineDto AssignmentDeadline { get; set; } = new();
    public OffsetPreferenceDto UpcomingLectureReminder { get; set; } = new()
    {
        Enabled = true,
        Offsets = new List<string> { "P1D", "PT1H" },
    };
}
