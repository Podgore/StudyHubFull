using StudyHub.Common.DTO.Notifications;
using StudyHub.Entities;

namespace StudyHub.BLL.Notifications;

public sealed class NotificationContext
{
    public required User User { get; init; }
    public required long ChatId { get; init; }
    public required IReadOnlyList<Guid> SubjectIds { get; init; }
    public required NotificationPreferencesDto Preferences { get; init; }
    public required DateTimeOffset Now { get; init; }
    public required DateTimeOffset WindowStart { get; init; }
    public required TimeSpan Period { get; init; }
}
