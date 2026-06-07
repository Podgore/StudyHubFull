using Globalization = System.Globalization;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Teachers;

public sealed class TeacherLowSubmissionRateStrategy : ITeacherNotificationStrategy
{
    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public TeacherLowSubmissionRateStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        if (!context.Preferences.Teacher.LowSubmissionRate.Enabled)
            return;

        var soonAssignments = await _databaseContext.Assignments.AsNoTracking()
            .Where(assignment => context.SubjectIds.Contains(assignment.SubjectId)
                                 && assignment.ClosingDate > context.Now.UtcDateTime
                                 && assignment.ClosingDate <= context.Now.UtcDateTime.AddHours(24))
            .Select(assignment => new { assignment.Id, assignment.Title, assignment.SubjectId })
            .ToListAsync(cancellationToken);

        foreach (var assignment in soonAssignments)
        {
            var enrolled = await _databaseContext.StudentSubjects.AsNoTracking()
                .CountAsync(studentSubject => studentSubject.SubjectId == assignment.SubjectId, cancellationToken);
            if (enrolled == 0)
                continue;

            var submitted = await _databaseContext.HomeworkSubmissions.AsNoTracking()
                .CountAsync(submission => submission.AssignmentId == assignment.Id, cancellationToken);

            if ((double)submitted / enrolled >= 0.5)
                continue;

            var dayKey = context.Now.ToString("yyyyMMdd", Globalization.CultureInfo.InvariantCulture);
            var key = $"teacher:lowsub:{context.User.Id}:{assignment.Id}:{dayKey}";
            await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                TeacherLowSubmissionRate(assignment.Title, submitted, enrolled), key, cancellationToken);
        }
    }
}
