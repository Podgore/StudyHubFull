namespace StudyHub.BLL.Notifications.Interfaces;

public interface ITelegramNotificationSender
{
    Task SendOnceAsync(Guid userId, long chatId, string html, string dedupeKey, CancellationToken cancellationToken);
    Task<bool> AlreadySentAsync(Guid userId, string dedupeKey, CancellationToken cancellationToken);
    Task RecordDedupeAsync(Guid userId, string dedupeKey, CancellationToken cancellationToken);
}
