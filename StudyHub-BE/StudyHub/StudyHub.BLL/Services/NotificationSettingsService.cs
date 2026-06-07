using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Helpers;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.Configs;
using StudyHub.Common.DTO.Notifications;
using StudyHub.Common.Exceptions;
using StudyHub.Common.Utility;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;
using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace StudyHub.BLL.Services;

public class NotificationSettingsService : INotificationSettingsService
{
    private readonly UserManager<User> _userManager;
    private readonly IRepository<TelegramLinkCode> _linkCodeRepository;
    private readonly ITelegramBotClient _telegramBot;
    private readonly TelegramConfig _telegramConfig;

    public NotificationSettingsService(
        UserManager<User> userManager,
        IRepository<TelegramLinkCode> linkCodeRepository,
        ITelegramBotClient telegramBot,
        TelegramConfig telegramConfig)
    {
        _userManager = userManager;
        _linkCodeRepository = linkCodeRepository;
        _telegramBot = telegramBot;
        _telegramConfig = telegramConfig;
    }

    public async Task<NotificationSettingsResponseDto> GetAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        return new NotificationSettingsResponseDto
        {
            Preferences = NotificationPreferencesSerializer.Deserialize(user.NotificationPreferencesJson),
            Telegram = BuildTelegramStatus(user),
        };
    }

    public async Task<NotificationSettingsResponseDto> UpdateAsync(
        Guid userId,
        UpdateNotificationSettingsRequestDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        dto.Preferences.Version = 1;
        user.NotificationPreferencesJson = NotificationPreferencesSerializer.Serialize(dto.Preferences);

        await _userManager.UpdateAsync(user);

        return new NotificationSettingsResponseDto
        {
            Preferences = dto.Preferences,
            Telegram = BuildTelegramStatus(user),
        };
    }

    public async Task<TelegramLinkResponseDto> CreateTelegramLinkAsync(Guid userId)
    {
        if (string.IsNullOrWhiteSpace(_telegramConfig.BotUsername))
            return new TelegramLinkResponseDto
            {
                DeepLink = string.Empty,
                ExpiresAt = DateTimeOffset.UtcNow,
                Message = NotificationSettingsConstants.BotUsernameNotConfigured,
            };

        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        var existing = await _linkCodeRepository.Where(x => x.UserId == userId).ToListAsync();
        foreach (var old in existing)
            await _linkCodeRepository.DeleteAsync(old, persist: false);
        await _linkCodeRepository.SaveChangesAsync();

        var code = Guid.NewGuid().ToString("N");
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(NotificationSettingsConstants.LinkExpiryMinutes);

        await _linkCodeRepository.InsertAsync(new TelegramLinkCode
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Code = code,
            ExpiresAt = expiresAt,
        });

        var botUsername = _telegramConfig.BotUsername.TrimStart('@');
        return new TelegramLinkResponseDto
        {
            DeepLink = $"https://t.me/{botUsername}?start={code}",
            ExpiresAt = expiresAt,
            Message = string.IsNullOrWhiteSpace(_telegramConfig.BotToken) ? NotificationSettingsConstants.BotTokenNotConfigured : null,
        };
    }

    public async Task DisconnectTelegramAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");
        user.TelegramChatId = null;
        await _userManager.UpdateAsync(user);
    }

    public async Task SendTestNotificationAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        if (user.TelegramChatId is null)
            throw new IncorrectParametersException(NotificationSettingsConstants.TelegramNotConnected);

        if (string.IsNullOrWhiteSpace(_telegramConfig.BotToken))
            throw new IncorrectParametersException(NotificationSettingsConstants.BotTokenMissing);

        try
        {
            await _telegramBot.SendMessage(
                user.TelegramChatId.Value,
                NotificationSettingsConstants.TestNotificationMessage,
                parseMode: ParseMode.Html);
        }
        catch (Telegram.Bot.Exceptions.ApiRequestException)
        {
            throw new IncorrectParametersException(NotificationSettingsConstants.TelegramSendFailed);
        }
    }

    public async Task<bool> TryHandleTelegramUpdateAsync(
        Telegram.Bot.Types.Update update,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramConfig.BotToken))
            return false;

        if (!TelegramUpdateParser.TryExtractStartCommand(update, out var chatId, out var code))
            return false;

        var link = await _linkCodeRepository.FirstOrDefaultAsync(x => x.Code == code, cancellationToken);
        if (link is null || link.ExpiresAt < DateTimeOffset.UtcNow)
            return false;

        var user = await _userManager.FindByIdAsync(link.UserId.ToString());
        if (user is null)
            return false;

        user.TelegramChatId = chatId;
        user.Telegram = TelegramUpdateParser.ResolveHandle(update.Message!.From, update.Message.Chat);
        await _userManager.UpdateAsync(user);

        await _linkCodeRepository.DeleteAsync(link);

        try
        {
            await _telegramBot.SendMessage(
                chatId,
                NotificationSettingsConstants.WelcomeMessage,
                parseMode: ParseMode.Html,
                cancellationToken: cancellationToken);
        }
        catch (Telegram.Bot.Exceptions.ApiRequestException)
        {
        }

        return true;
    }

    private TelegramStatusDto BuildTelegramStatus(User user)
    {
        string? displayHandle = null;
        if (!string.IsNullOrWhiteSpace(user.Telegram))
            displayHandle = user.Telegram.Trim();
        else if (user.TelegramChatId is not null)
            displayHandle = "connected";

        return new TelegramStatusDto
        {
            Connected = user.TelegramChatId is not null,
            DisplayHandle = displayHandle,
            BotConfigured = !string.IsNullOrWhiteSpace(_telegramConfig.BotToken)
                         && !string.IsNullOrWhiteSpace(_telegramConfig.BotUsername),
        };
    }
}