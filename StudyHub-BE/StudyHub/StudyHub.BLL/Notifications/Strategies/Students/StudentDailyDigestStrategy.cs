using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.DAL.EF;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications.Strategies.Students;

public sealed class StudentDailyDigestStrategy : IStudentDailyDigestStrategy
{
    private readonly ApplicationDbContext _databaseContext;
    private readonly ITelegramNotificationSender _sender;

    public StudentDailyDigestStrategy(ApplicationDbContext databaseContext, ITelegramNotificationSender sender)
        => (_databaseContext, _sender) = (databaseContext, sender);

    public async Task ExecuteAsync(NotificationContext context, CancellationToken cancellationToken)
    {
        var lectures = new List<(Guid Id, string Title, DateTimeOffset Start, string InclusionKey)>();
        var publishedAssignments = new List<(Guid Id, string Title, string InclusionKey)>();
        var openedAssignments = new List<(Guid Id, string Title, string InclusionKey)>();

        var lecturePrefs = context.Preferences.Student.NewLecture;
        if (lecturePrefs.Enabled
            && lecturePrefs.Frequency == "daily_digest"
            && (lecturePrefs.NotifyOn == "published" || lecturePrefs.NotifyOn == "both"))
        {
            var lectureRows = await _databaseContext.Lectures.AsNoTracking()
                .Where(lecture => context.SubjectIds.Contains(lecture.SubjectId))
                .Select(lecture => new { lecture.Id, lecture.Title, lecture.LectureDate })
                .ToListAsync(cancellationToken);

            foreach (var lecture in lectureRows)
            {
                var inclusionKey = DigestDedupeKeys.StudentDigestIncludedLecture(context.User.Id, lecture.Id);
                var legacyInstantKey = $"student:newlecture:{context.User.Id}:{lecture.Id}";
                if (await _sender.AlreadySentAsync(context.User.Id, inclusionKey, cancellationToken)
                    || await _sender.AlreadySentAsync(context.User.Id, legacyInstantKey, cancellationToken))
                    continue;

                lectures.Add((lecture.Id, lecture.Title, ToUtc(lecture.LectureDate), inclusionKey));
            }
        }

        var assignmentPrefs = context.Preferences.Student.NewAssignment;
        if (assignmentPrefs.Enabled && assignmentPrefs.Frequency == "daily_digest")
        {
            var assignmentRows = await _databaseContext.Assignments.AsNoTracking()
                .Where(assignment => context.SubjectIds.Contains(assignment.SubjectId))
                .Select(assignment => new { assignment.Id, assignment.Title, assignment.OpeningDate })
                .ToListAsync(cancellationToken);

            foreach (var assignment in assignmentRows)
            {
                if (assignmentPrefs.NotifyOn is "published" or "both")
                {
                    var inclusionKey = DigestDedupeKeys.StudentDigestIncludedAssignmentPublished(
                        context.User.Id, assignment.Id);
                    var legacyPublishKey = $"student:assignpublished:{context.User.Id}:{assignment.Id}";
                    if (!await _sender.AlreadySentAsync(context.User.Id, inclusionKey, cancellationToken)
                        && !await _sender.AlreadySentAsync(context.User.Id, legacyPublishKey, cancellationToken))
                        publishedAssignments.Add((assignment.Id, assignment.Title, inclusionKey));
                }

                if (assignmentPrefs.NotifyOn is "opens" or "both")
                {
                    var open = ToUtc(assignment.OpeningDate);
                    if (open > context.Now)
                        continue;

                    var inclusionKey = DigestDedupeKeys.StudentDigestIncludedAssignmentOpened(
                        context.User.Id, assignment.Id);
                    var legacyOpenKey = $"student:assignopen:{context.User.Id}:{assignment.Id}";
                    if (!await _sender.AlreadySentAsync(context.User.Id, inclusionKey, cancellationToken)
                        && !await _sender.AlreadySentAsync(context.User.Id, legacyOpenKey, cancellationToken))
                        openedAssignments.Add((assignment.Id, assignment.Title, inclusionKey));
                }
            }
        }

        var itemIds = lectures.Select(row => row.Id)
            .Concat(publishedAssignments.Select(row => row.Id))
            .Concat(openedAssignments.Select(row => row.Id));

        var message = StudentDailyDigest(
            lectures.Select(row => (row.Title, row.Start)).ToList(),
            publishedAssignments.Select(row => row.Title).ToList(),
            openedAssignments.Select(row => row.Title).ToList());

        if (message is null)
            return;

        var batchKey = DigestDedupeKeys.StudentDigestBatch(context.User.Id, context.Now, itemIds);
        if (await _sender.AlreadySentAsync(context.User.Id, batchKey, cancellationToken))
            return;

        await _sender.SendOnceAsync(context.User.Id, context.ChatId, message, batchKey, cancellationToken);

        foreach (var (_, _, _, inclusionKey) in lectures)
            await _sender.RecordDedupeAsync(context.User.Id, inclusionKey, cancellationToken);

        foreach (var (_, _, inclusionKey) in publishedAssignments)
            await _sender.RecordDedupeAsync(context.User.Id, inclusionKey, cancellationToken);

        foreach (var (_, _, inclusionKey) in openedAssignments)
            await _sender.RecordDedupeAsync(context.User.Id, inclusionKey, cancellationToken);
    }
}
