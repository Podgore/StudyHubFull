using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Teachers;

public sealed class TeacherPendingGradingStrategy : ITeacherNotificationStrategy
{
    private sealed record PendingHomeworkRow(Guid Id, DateTime UpdatedAt, string Title);

    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public TeacherPendingGradingStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        var teacherNotificationPreferences = context.Preferences.Teacher;
        var pendingHomeworkQuery = PendingHomework(context);

        var instantSub = teacherNotificationPreferences.NewStudentSubmissions.Frequency == "instant"
                         && teacherNotificationPreferences.NewStudentSubmissions.Enabled;
        var instantGrade = teacherNotificationPreferences.GradingRequired.Frequency == "instant"
                           && teacherNotificationPreferences.GradingRequired.Enabled;

        if (instantSub || instantGrade)
            await DispatchInstantAsync(context, pendingHomeworkQuery, cancellationToken);
    }

    private IQueryable<PendingHomeworkRow> PendingHomework(NotificationContext context) =>
        from homeworkSubmission in _databaseContext.HomeworkSubmissions.AsNoTracking()
        join assignment in _databaseContext.Assignments.AsNoTracking() on homeworkSubmission.AssignmentId equals assignment.Id
        where context.SubjectIds.Contains(assignment.SubjectId)
              && homeworkSubmission.TeacherScore == null
              && (!string.IsNullOrWhiteSpace(homeworkSubmission.StudentComment)
                  || _databaseContext.HomeworkSubmissionAttachments.Any(
                      attachment => attachment.HomeworkSubmissionId == homeworkSubmission.Id))
        select new PendingHomeworkRow(homeworkSubmission.Id, homeworkSubmission.UpdatedAt, assignment.Title);

    private async Task DispatchInstantAsync(
        NotificationContext context,
        IQueryable<PendingHomeworkRow> pendingHomeworkQuery,
        CancellationToken cancellationToken)
    {
        var instantWindowStart = context.Now - TimeSpan.FromMinutes(35);
        var fresh = await pendingHomeworkQuery
            .Where(pendingRow => pendingRow.UpdatedAt >= instantWindowStart.UtcDateTime && pendingRow.UpdatedAt <= context.Now.UtcDateTime)
            .ToListAsync(cancellationToken);

        if (fresh.Count == 0)
            return;

        var slot = (long)(context.Now.UtcDateTime - DateTime.UnixEpoch).TotalMinutes / 10;
        var key = $"teacher:pendinginstant:{context.User.Id}:{slot}";
        var totalHomework = await pendingHomeworkQuery.CountAsync(cancellationToken);
        var titles = fresh.ConvertAll(pendingRow => pendingRow.Title);

        await _sender.SendOnceAsync(context.User.Id, context.ChatId,
            TeacherInstantPendingHomework(titles, fresh.Count, totalHomework), key, cancellationToken);
    }
}
