using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;
using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace StudyHub.BLL.Notifications;

public sealed class TelegramNotificationSender : ITelegramNotificationSender
{
    private readonly ITelegramBotClient _bot;
    private readonly IRepository<TelegramNotificationLog> _logs;
    private readonly ILogger<TelegramNotificationSender> _logger;

    public TelegramNotificationSender(
        ITelegramBotClient bot,
        IRepository<TelegramNotificationLog> logs,
        ILogger<TelegramNotificationSender> logger)
    {
        _bot = bot;
        _logs = logs;
        _logger = logger;
    }

    public async Task<bool> AlreadySentAsync(Guid userId, string dedupeKey, CancellationToken cancellationToken) =>
        await _logs.AnyAsync(logEntry => logEntry.UserId == userId && logEntry.DedupeKey == dedupeKey, cancellationToken);

    public async Task SendOnceAsync(Guid userId, long chatId, string html, string dedupeKey, CancellationToken cancellationToken)
    {
        if (dedupeKey.Length > 256)
            dedupeKey = dedupeKey[..256];

        if (await AlreadySentAsync(userId, dedupeKey, cancellationToken))
            return;

        try
        {
            await _bot.SendMessage(chatId, html, parseMode: ParseMode.Html, cancellationToken: cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogDebug(exception, "Telegram send skipped for user {UserId}", userId);
            return;
        }

        await RecordDedupeAsync(userId, dedupeKey, cancellationToken);
    }

    public async Task RecordDedupeAsync(Guid userId, string dedupeKey, CancellationToken cancellationToken)
    {
        if (dedupeKey.Length > 256)
            dedupeKey = dedupeKey[..256];

        if (await AlreadySentAsync(userId, dedupeKey, cancellationToken))
            return;

        await _logs.InsertAsync(new TelegramNotificationLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DedupeKey = dedupeKey,
            SentAt = DateTimeOffset.UtcNow,
        }, persist: false);
        await _logs.SaveChangesAsync();
    }
}
