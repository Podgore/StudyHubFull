using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Students;

public sealed class StudentDeadlineStrategy : IStudentNotificationStrategy
{
    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public StudentDeadlineStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        if (!context.Preferences.Student.AssignmentDeadline.Enabled)
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

            foreach (var offsetIso in context.Preferences.Student.AssignmentDeadline.Offsets)
            {
                if (!TryParseOffset(offsetIso, out var offset))
                    continue;
                var trigger = closing - offset;
                if (!InWindow(trigger, context.Now, context.Period))
                    continue;

                var key = $"student:deadline:{context.User.Id}:{assignment.Id}:{offsetIso}";
                await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                    StudentDeadlineSoon(assignment.Title, offsetIso), key, cancellationToken);
            }
        }
    }
}
