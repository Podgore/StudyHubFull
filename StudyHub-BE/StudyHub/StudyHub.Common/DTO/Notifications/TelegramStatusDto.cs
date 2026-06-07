namespace StudyHub.Common.DTO.Notifications;

public class TelegramStatusDto
{
    public bool Connected { get; set; }
    public string? DisplayHandle { get; set; }
    public bool BotConfigured { get; set; }
}
