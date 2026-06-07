using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.Common.DTO.Notifications;
using StudyHub.DAL.EF;
using StudyHub.Entities;
using System.Text.Json;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications;

public sealed class InstantEventNotifier
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private readonly ApplicationDbContext _databaseContext;
    private readonly UserManager<User> _userManager;
    private readonly ITelegramNotificationSender _sender;
    private readonly ILogger<InstantEventNotifier> _logger;

    public InstantEventNotifier(
        ApplicationDbContext databaseContext,
        UserManager<User> userManager,
        ITelegramNotificationSender sender,
        ILogger<InstantEventNotifier> logger)
    {
        _databaseContext = databaseContext;
        _userManager = userManager;
        _sender = sender;
        _logger = logger;
    }

    public async Task NotifyAfterHomeworkSubmissionUpdatedAsync(
        Guid assignmentId,
        Guid homeworkSubmissionId,
        CancellationToken cancellationToken = default)
    {
        var (teacher, chatId, teacherNotificationPreferences) =
            await ResolveTeacherAsync(assignmentId, AssignmentKind.Homework, cancellationToken);
        if (teacher is null)
            return;

        var instantSub = teacherNotificationPreferences.NewStudentSubmissions.Frequency == "instant"
                         && teacherNotificationPreferences.NewStudentSubmissions.Enabled;
        var instantGrade = teacherNotificationPreferences.GradingRequired.Frequency == "instant"
                           && teacherNotificationPreferences.GradingRequired.Enabled;
        if (!instantSub && !instantGrade)
            return;

        var title = await (
                from submission in _databaseContext.HomeworkSubmissions.AsNoTracking()
                join assignment in _databaseContext.Assignments.AsNoTracking() on submission.AssignmentId equals assignment.Id
                where submission.Id == homeworkSubmissionId
                      && submission.AssignmentId == assignmentId
                      && submission.TeacherScore == null
                      && (!string.IsNullOrWhiteSpace(submission.StudentComment)
                          || _databaseContext.HomeworkSubmissionAttachments.Any(
                              attachment => attachment.HomeworkSubmissionId == submission.Id))
                select assignment.Title)
            .FirstOrDefaultAsync(cancellationToken);

        if (title is null)
            return;

        var slot = (long)(DateTime.UtcNow - DateTime.UnixEpoch).TotalMinutes / 10;
        var key = $"teacher:pendinginstant:{teacher.Id}:{slot}";
        await _sender.SendOnceAsync(teacher.Id, chatId, TeacherNewHomeworkSubmission(title), key, cancellationToken);
    }

    public async Task NotifyAfterTestSubmittedAsync(
        Guid assignmentId,
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        var finished = await _databaseContext.StartingTimeRecords.AsNoTracking()
            .AnyAsync(
                record => record.AssignmentId == assignmentId && record.StudentId == studentId && record.IsFinished,
                cancellationToken);
        if (!finished)
            return;

        var pendingOpenEnded = await (
                from studentAnswer in _databaseContext.StudentAnswers.AsNoTracking()
                join taskVariant in _databaseContext.TaskVariants.AsNoTracking() on studentAnswer.TaskVariantId equals taskVariant.Id
                join assignmentTask in _databaseContext.AssignmentTasks.AsNoTracking() on taskVariant.AssignmentTaskId equals assignmentTask.Id
                join assignment in _databaseContext.Assignments.AsNoTracking() on assignmentTask.AssignmentId equals assignment.Id
                where assignment.Id == assignmentId
                      && studentAnswer.StudentId == studentId
                      && !studentAnswer.OpenEndedTeacherReviewed
                      && !_databaseContext.TaskOptions.Any(
                          option => option.TaskVariantId == studentAnswer.TaskVariantId && option.IsCorrect == true)
                select 1)
            .AnyAsync(cancellationToken);

        if (!pendingOpenEnded)
            return;

        var (teacher, chatId, teacherNotificationPreferences) =
            await ResolveTeacherAsync(assignmentId, AssignmentKind.TimedTest, cancellationToken);
        if (teacher is null)
            return;

        var instantSub = teacherNotificationPreferences.NewStudentSubmissions.Frequency == "instant"
                         && teacherNotificationPreferences.NewStudentSubmissions.Enabled;
        var instantGrade = teacherNotificationPreferences.GradingRequired.Frequency == "instant"
                           && teacherNotificationPreferences.GradingRequired.Enabled;
        if (!instantSub && !instantGrade)
            return;

        var title = await _databaseContext.Assignments.AsNoTracking()
            .Where(assignment => assignment.Id == assignmentId)
            .Select(assignment => assignment.Title)
            .FirstOrDefaultAsync(cancellationToken) ?? "Test";

        var studentRow = await _databaseContext.Users.AsNoTracking()
            .Where(user => user.Id == studentId)
            .Select(user => new { user.FullName, user.UserName, user.Email })
            .FirstOrDefaultAsync(cancellationToken);

        var studentDisplayName = studentRow is null
            ? "Unknown student"
            : !string.IsNullOrWhiteSpace(studentRow.FullName)
                ? studentRow.FullName
                : !string.IsNullOrWhiteSpace(studentRow.UserName)
                    ? studentRow.UserName
                    : studentRow.Email ?? "Unknown student";

        var slot = (long)(DateTime.UtcNow - DateTime.UnixEpoch).TotalMinutes / 10;
        var key = $"teacher:openendedevt:{assignmentId}:{studentId}:{slot}";
        await _sender.SendOnceAsync(
            teacher.Id, chatId, TeacherOpenEndedNeedsReview(title, studentDisplayName), key, cancellationToken);
    }

    private async Task<(User? teacher, long chatId, TeacherNotificationPreferencesDto teacherNotificationPreferences)>
        ResolveTeacherAsync(Guid assignmentId, AssignmentKind kind, CancellationToken cancellationToken)
    {
        var teacherId = await _databaseContext.Assignments.AsNoTracking()
            .Where(assignment => assignment.Id == assignmentId && assignment.Kind == kind)
            .Select(assignment => (Guid?)assignment.Subject!.TeacherId)
            .FirstOrDefaultAsync(cancellationToken);

        if (teacherId is not { } resolvedTeacherId)
            return default;

        var teacher = await _userManager.FindByIdAsync(resolvedTeacherId.ToString());
        if (teacher?.TelegramChatId is not long chatId
            || string.IsNullOrWhiteSpace(teacher.NotificationPreferencesJson))
            return default;

        TeacherNotificationPreferencesDto teacherNotificationPreferences;
        try
        {
            teacherNotificationPreferences = (JsonSerializer.Deserialize<NotificationPreferencesDto>(
                teacher.NotificationPreferencesJson, JsonOpts) ?? new()).Teacher;
        }
        catch
        {
            _logger.LogWarning("Failed to parse notification preferences for teacher {TeacherId}", resolvedTeacherId);
            return default;
        }

        return (teacher, chatId, teacherNotificationPreferences);
    }
}
