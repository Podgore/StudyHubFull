using StudyHub.BLL.Notifications;

namespace StudyHub.BLL.Notifications.Interfaces;

public interface INotificationStrategy
{
    Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken);
}
