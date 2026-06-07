namespace StudyHub.Common.DTO.Notifications;

public class TeacherNotificationPreferencesDto
{
    public TeacherDigestPreferenceDto NewStudentSubmissions { get; set; } = new();
    public TeacherGradingReminderDto GradingRequired { get; set; } = new();
    public OffsetPreferenceDto AssignmentDeadlinesApproaching { get; set; } = new()
    {
        Enabled = true,
        Offsets = new List<string> { "P1D" },
    };
    public NotificationToggleDto LowSubmissionRate { get; set; } = new();
    public OffsetPreferenceDto UpcomingLectureReminder { get; set; } = new()
    {
        Enabled = true,
        Offsets = new List<string> { "P1D", "PT1H" },
    };
    public NotificationToggleDto StudentQuestions { get; set; } = new();
}
