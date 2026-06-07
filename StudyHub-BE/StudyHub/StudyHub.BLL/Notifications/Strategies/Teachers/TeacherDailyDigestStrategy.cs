using Globalization = System.Globalization;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.Common.DTO.Notifications;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Teachers;

public sealed class TeacherDailyDigestStrategy : ITeacherDailyDigestStrategy
{
    private sealed record PendingHomeworkRow(Guid Id, DateTime UpdatedAt, string Title);

    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public TeacherDailyDigestStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        var teacherNotificationPreferences = context.Preferences.Teacher;
        var pendingHomeworkQuery = PendingHomework(context);

        var pendingOpenEndedCount = await (
                from studentAnswer in _databaseContext.StudentAnswers.AsNoTracking()
                join taskVariant in _databaseContext.TaskVariants.AsNoTracking() on studentAnswer.TaskVariantId equals taskVariant.Id
                join assignmentTask in _databaseContext.AssignmentTasks.AsNoTracking() on taskVariant.AssignmentTaskId equals assignmentTask.Id
                join assignment in _databaseContext.Assignments.AsNoTracking() on assignmentTask.AssignmentId equals assignment.Id
                join startingTimeRecord in _databaseContext.StartingTimeRecords.AsNoTracking()
                    on new { AssignmentId = assignment.Id, StudentId = studentAnswer.StudentId } equals new { startingTimeRecord.AssignmentId, startingTimeRecord.StudentId }
                where context.SubjectIds.Contains(assignment.SubjectId)
                      && startingTimeRecord.IsFinished
                      && !studentAnswer.OpenEndedTeacherReviewed
                      && !_databaseContext.TaskOptions.Any(
                          option => option.TaskVariantId == studentAnswer.TaskVariantId && option.IsCorrect == true)
                select studentAnswer.Id)
            .CountAsync(cancellationToken);

        var pendingHomeworkCount = await pendingHomeworkQuery.CountAsync(cancellationToken);
        var pendingCount = pendingHomeworkCount + pendingOpenEndedCount;
        if (pendingCount == 0)
            return;

        if (teacherNotificationPreferences.NewStudentSubmissions.Enabled
            && teacherNotificationPreferences.NewStudentSubmissions.Frequency == "daily_digest")
        {
            var key = $"teacher:digest:sub:daily:{context.User.Id}:{context.Now:yyyyMMdd}";
            await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                TeacherDailyDigest(pendingCount, pendingHomeworkCount, pendingOpenEndedCount), key, cancellationToken);
        }

        if (teacherNotificationPreferences.NewStudentSubmissions.Enabled
            && teacherNotificationPreferences.NewStudentSubmissions.Frequency == "weekly_digest"
            && context.Now.DayOfWeek == DayOfWeek.Monday)
        {
            var isoWeekNumber = Globalization.ISOWeek.GetWeekOfYear(context.Now.DateTime);
            var key = $"teacher:digest:sub:weekly:{context.User.Id}:{context.Now.Year}W{isoWeekNumber}";
            await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                TeacherWeeklyDigest(pendingCount, pendingHomeworkCount, pendingOpenEndedCount), key, cancellationToken);
        }

        if (teacherNotificationPreferences.GradingRequired.Enabled
            && teacherNotificationPreferences.GradingRequired.Frequency == "daily_pending")
        {
            var key = $"teacher:digest:grade:{context.User.Id}:{context.Now:yyyyMMdd}";
            await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                TeacherDailyGradingQueue(pendingCount, pendingHomeworkCount, pendingOpenEndedCount), key, cancellationToken);
        }
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
}
