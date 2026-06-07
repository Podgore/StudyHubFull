namespace StudyHub.Common.Utility;

public static class NotificationSettingsConstants
{
    public const int LinkCodeMinLength = 8;
    public const int LinkCodeMaxLength = 64;
    public const int LinkExpiryMinutes = 20;

    public const string TestNotificationMessage = "<b>StudyHub</b>\nTest notification — your settings are working.";
    public const string WelcomeMessage = "✅ Connected! StudyHub will send notifications here.\nYou can return to the web app.";
    public const string BotUsernameNotConfigured = "Telegram bot is not configured on the server (TelegramConfig:BotUsername).";
    public const string BotTokenNotConfigured = "Open the link in Telegram while the StudyHub API is running; BotToken must be set on the server.";
    public const string TelegramNotConnected = "Telegram is not connected.";
    public const string BotTokenMissing = "Could not send Telegram message. BotToken is not configured.";
    public const string TelegramSendFailed = "Could not send Telegram message. Check BotToken and chat id.";
}