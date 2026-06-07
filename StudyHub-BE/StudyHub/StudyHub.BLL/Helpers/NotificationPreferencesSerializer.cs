using StudyHub.Common.DTO.Notifications;
using System.Text.Json;

namespace StudyHub.BLL.Helpers;

public static class NotificationPreferencesSerializer
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string Serialize(NotificationPreferencesDto preferences) =>
        JsonSerializer.Serialize(preferences, Options);

    public static NotificationPreferencesDto Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new NotificationPreferencesDto();

        try
        {
            return JsonSerializer.Deserialize<NotificationPreferencesDto>(json, Options)
                ?? new NotificationPreferencesDto();
        }
        catch
        {
            return new NotificationPreferencesDto();
        }
    }
}