using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Students;

public sealed class StudentNewAssignmentStrategy : IStudentNotificationStrategy
{
    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public StudentNewAssignmentStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        var newAssignmentPreferences = context.Preferences.Student.NewAssignment;
        if (!newAssignmentPreferences.Enabled
            || newAssignmentPreferences.Frequency != "instant"
            || newAssignmentPreferences.NotifyOn != "opens" && newAssignmentPreferences.NotifyOn != "both")
            return;

        var openedAssignments = await _databaseContext.Assignments.AsNoTracking()
            .Where(assignment => context.SubjectIds.Contains(assignment.SubjectId))
            .Select(assignment => new { assignment.Id, assignment.Title, assignment.OpeningDate })
            .ToListAsync(cancellationToken);

        foreach (var assignment in openedAssignments)
        {
            var open = ToUtc(assignment.OpeningDate);
            if (!InWindow(open, context.Now, context.Period))
                continue;

            var key = $"student:assignopen:{context.User.Id}:{assignment.Id}";
            await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                StudentAssignmentOpened(assignment.Title), key, cancellationToken);
        }
    }
}
