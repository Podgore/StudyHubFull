namespace StudyHub.BLL.Services.Interfaces;

public interface INotificationDispatchService
{
    Task RunScheduledNotificationsAsync(CancellationToken cancellationToken = default);

    Task RunDailyDigestNotificationsAsync(CancellationToken cancellationToken = default);

    Task NotifyAfterHomeworkSubmissionUpdatedAsync(Guid assignmentId, Guid homeworkSubmissionId, CancellationToken cancellationToken = default);

    Task NotifyAfterTestSubmittedAsync(Guid assignmentId, Guid studentId, CancellationToken cancellationToken = default);

    Task NotifyAfterLecturePublishedAsync(Guid lectureId, CancellationToken cancellationToken = default);

    Task NotifyAfterAssignmentPublishedAsync(Guid assignmentId, CancellationToken cancellationToken = default);
}
