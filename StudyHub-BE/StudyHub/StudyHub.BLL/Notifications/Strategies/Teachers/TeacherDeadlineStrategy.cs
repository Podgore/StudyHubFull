using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Teachers;

public sealed class TeacherDeadlineStrategy : ITeacherNotificationStrategy
{
    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public TeacherDeadlineStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        if (!context.Preferences.Teacher.AssignmentDeadlinesApproaching.Enabled)
            return;

        var assignments = await _databaseContext.Assignments.AsNoTracking()
            .Where(assignment => context.SubjectIds.Contains(assignment.SubjectId))
            .Select(assignment => new { assignment.Id, assignment.Title, assignment.ClosingDate })
            .ToListAsync(cancellationToken);

        foreach (var assignment in assignments)
        {
            var closing = ToUtc(assignment.ClosingDate);
            if (closing <= context.Now)
                continue;

            foreach (var offsetIso in context.Preferences.Teacher.AssignmentDeadlinesApproaching.Offsets)
            {
                if (!TryParseOffset(offsetIso, out var offset))
                    continue;
                var trigger = closing - offset;
                if (!InWindow(trigger, context.Now, context.Period))
                    continue;

                var key = $"teacher:deadline:{context.User.Id}:{assignment.Id}:{offsetIso}";
                await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                    TeacherDeadlineSoon(assignment.Title, offsetIso), key, cancellationToken);
            }
        }
    }
}
