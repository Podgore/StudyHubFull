using Microsoft.Extensions.Options;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.Configs;
using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace StudyHub.Services;

public sealed class TelegramBotPollingHostedService : BackgroundService
{
    private readonly IOptions<TelegramConfig> _options;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelegramBotPollingHostedService> _logger;
    private readonly global::Telegram.Bot.ITelegramBotClient _bot;

    public TelegramBotPollingHostedService(
        IOptions<TelegramConfig> options,
        IServiceScopeFactory scopeFactory,
        ILogger<TelegramBotPollingHostedService> logger,
        global::Telegram.Bot.ITelegramBotClient bot)
    {
        _options = options;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _bot = bot;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var cfg = _options.Value;
        if (string.IsNullOrWhiteSpace(cfg.BotToken))
        {
            _logger.LogInformation("Telegram: BotToken empty; StartReceiving not started.");
            return;
        }

        var bot = _bot;

        try
        {
            await bot.DeleteWebhook(dropPendingUpdates: false, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Telegram DeleteWebhook failed (ok if none was set).");
        }

        var receiverOptions = new ReceiverOptions
        {
            AllowedUpdates = Array.Empty<UpdateType>(),
        };

        bot.StartReceiving(
            HandleUpdateAsync,
            HandlePollingErrorAsync,
            receiverOptions,
            stoppingToken);

        try
        {
            var me = await bot.GetMe(stoppingToken);
            _logger.LogInformation("Telegram bot @{MeUsername} — StartReceiving (long polling) running.", me.Username);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram GetMe failed after StartReceiving.");
        }

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // shutdown
        }
    }

    private async Task HandleUpdateAsync(global::Telegram.Bot.ITelegramBotClient bot, Update update, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var notifications = scope.ServiceProvider.GetRequiredService<INotificationSettingsService>();

        if (await notifications.TryHandleTelegramUpdateAsync(update, ct))
            return;

        if (update.Message is not { Text: { } messageText } message)
            return;

        if (!messageText.StartsWith("/start", StringComparison.OrdinalIgnoreCase))
            return;

        var parts = messageText.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2)
        {
            await bot.SendMessage(
                message.Chat.Id,
                "That link code is invalid or expired. Open StudyHub → Settings → Connect Telegram to create a new link.",
                cancellationToken: ct);
            return;
        }

        await bot.SendMessage(
            message.Chat.Id,
            "✅ To link this chat to your StudyHub account:\n" +
            "1) Open the web app → Settings → Connect Telegram\n" +
            "2) Tap the link we give you (it includes /start and a code).\n\n" +
            "Plain /start here cannot tell which user you are.",
            cancellationToken: ct);
    }

    private Task HandlePollingErrorAsync(global::Telegram.Bot.ITelegramBotClient bot, Exception ex, CancellationToken ct)
    {
        _logger.LogError(ex, "Telegram polling error");
        return Task.CompletedTask;
    }
}
