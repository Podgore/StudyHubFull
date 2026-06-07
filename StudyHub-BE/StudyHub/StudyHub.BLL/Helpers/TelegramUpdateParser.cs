using StudyHub.Common.Utility;
using Telegram.Bot.Types;

namespace StudyHub.BLL.Helpers;

internal class TelegramUpdateParser
{
    public static bool TryExtractStartCommand(
        Update update,
        out long chatId,
        out string code)
    {
        chatId = 0;
        code = string.Empty;

        if (update.Message is not { Text: { } text } message)
            return false;

        if (!text.StartsWith("/start", StringComparison.OrdinalIgnoreCase))
            return false;

        var parts = text.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2)
            return false;

        var candidate = parts[1].Trim();
        if (candidate.Length is < NotificationSettingsConstants.LinkCodeMinLength or > NotificationSettingsConstants.LinkCodeMaxLength)
            return false;

        if (message.Chat.Id == 0)
            return false;

        chatId = message.Chat.Id;
        code = candidate;
        return true;
    }

    public static string? ResolveHandle(User? fromUser, Chat chat)
    {
        var handle = fromUser?.Username ?? chat.Username;
        return string.IsNullOrEmpty(handle) ? null : "@" + handle.TrimStart('@');
    }
}
