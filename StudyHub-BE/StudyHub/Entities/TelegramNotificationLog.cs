namespace StudyHub.Entities;

public class TelegramNotificationLog : EntityBase
{
    public Guid UserId { get; set; }
    public string DedupeKey { get; set; } = string.Empty;
    public DateTimeOffset SentAt { get; set; }
}
