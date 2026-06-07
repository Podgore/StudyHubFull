using Microsoft.AspNetCore.Identity;

namespace StudyHub.Entities;

public class User : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public string? Telegram { get; set; } = null;
    public long? TelegramChatId { get; set; }
    public string? NotificationPreferencesJson { get; set; }
    public string? Group { get; set; } = null;
    public string? Course { get; set; } = null;
    public string? Faculty { get; set; } = null;

    public List<Subject> TeacherSubjects { get; set; } = null!;
    public List<StudentSubject> StudentSubjects { get; set; } = null!;
    public List<StudentAnswer> Answers { get; set; } = null!;
}