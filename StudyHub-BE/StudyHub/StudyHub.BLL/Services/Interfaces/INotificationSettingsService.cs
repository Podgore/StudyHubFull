using StudyHub.Common.DTO.Notifications;

namespace StudyHub.BLL.Services.Interfaces;

public interface INotificationSettingsService
{
    Task<NotificationSettingsResponseDto> GetAsync(Guid userId);
    Task<NotificationSettingsResponseDto> UpdateAsync(Guid userId, UpdateNotificationSettingsRequestDto dto);
    Task<TelegramLinkResponseDto> CreateTelegramLinkAsync(Guid userId);
    Task DisconnectTelegramAsync(Guid userId);
    Task SendTestNotificationAsync(Guid userId);
    Task<bool> TryHandleTelegramUpdateAsync(Telegram.Bot.Types.Update update, CancellationToken cancellationToken = default);
}
