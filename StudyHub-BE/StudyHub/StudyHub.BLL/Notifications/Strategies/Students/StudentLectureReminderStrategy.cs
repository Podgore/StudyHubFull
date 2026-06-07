using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Students;

public sealed class StudentLectureReminderStrategy : IStudentNotificationStrategy
{
    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public StudentLectureReminderStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        if (!context.Preferences.Student.UpcomingLectureReminder.Enabled)
            return;

        var lectures = await _databaseContext.Lectures.AsNoTracking()
            .Where(lecture => context.SubjectIds.Contains(lecture.SubjectId) && lecture.LectureDate > context.Now.UtcDateTime.AddDays(-1))
            .Select(lecture => new { lecture.Id, lecture.Title, lecture.LectureDate })
            .ToListAsync(cancellationToken);

        foreach (var lecture in lectures)
        {
            var start = ToUtc(lecture.LectureDate);
            if (start <= context.Now)
                continue;

            foreach (var offsetIso in context.Preferences.Student.UpcomingLectureReminder.Offsets)
            {
                if (!TryParseOffset(offsetIso, out var offset))
                    continue;
                var trigger = start - offset;
                if (!InWindow(trigger, context.Now, context.Period))
                    continue;

                var key = $"student:lecture:{context.User.Id}:{lecture.Id}:{offsetIso}";
                await _sender.SendOnceAsync(context.User.Id, context.ChatId,
                    StudentLectureSoon(lecture.Title, offsetIso), key, cancellationToken);
            }
        }
    }
}
