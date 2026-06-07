namespace StudyHub.Common.DTO.Notifications;

public class TelegramLinkResponseDto
{
    public string DeepLink { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public string? Message { get; set; }
}
