using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.Common.Configs;
using StudyHub.Common.DTO.Notifications;
using StudyHub.DAL.EF;
using StudyHub.Entities;
using System.Text.Json;
using static StudyHub.BLL.Notifications.NotificationMessages;

namespace StudyHub.BLL.Notifications;

public sealed class StudentContentInstantNotifier
{
    private const string RoleStudent = "Student";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private readonly ApplicationDbContext _databaseContext;
    private readonly UserManager<User> _userManager;
    private readonly ITelegramNotificationSender _sender;
    private readonly IOptions<TelegramConfig> _telegramCfg;
    private readonly ILogger<StudentContentInstantNotifier> _logger;

    public StudentContentInstantNotifier(
        ApplicationDbContext databaseContext,
        UserManager<User> userManager,
        ITelegramNotificationSender sender,
        IOptions<TelegramConfig> telegramCfg,
        ILogger<StudentContentInstantNotifier> logger)
    {
        _databaseContext = databaseContext;
        _userManager = userManager;
        _sender = sender;
        _telegramCfg = telegramCfg;
        _logger = logger;
    }

    public async Task NotifyLecturePublishedAsync(Guid lectureId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return;

        var lecture = await _databaseContext.Lectures.AsNoTracking()
            .Where(l => l.Id == lectureId)
            .Select(l => new { l.SubjectId, l.Title, l.LectureDate })
            .FirstOrDefaultAsync(cancellationToken);

        if (lecture is null)
            return;

        var studentIds = await GetEnrolledStudentIdsAsync(lecture.SubjectId, cancellationToken);
        if (studentIds.Count == 0)
            return;

        var start = ToUtc(lecture.LectureDate);
        foreach (var studentId in studentIds)
        {
            var prefs = await LoadStudentPreferencesAsync(studentId, cancellationToken);
            if (prefs is null)
                continue;

            var lecturePrefs = prefs.NewLecture;
            if (!ShouldNotifyOnPublish(lecturePrefs.Enabled, lecturePrefs.Frequency, lecturePrefs.NotifyOn))
                continue;

            var user = await _userManager.FindByIdAsync(studentId.ToString());
            if (user?.TelegramChatId is not long chatId)
                continue;

            var key = $"student:newlecture:{studentId}:{lectureId}";
            await _sender.SendOnceAsync(
                studentId,
                chatId,
                StudentNewLectureScheduled(lecture.Title, start),
                key,
                cancellationToken);
        }
    }

    public async Task NotifyAssignmentPublishedAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return;

        var assignment = await _databaseContext.Assignments.AsNoTracking()
            .Where(a => a.Id == assignmentId)
            .Select(a => new { a.SubjectId, a.Title, a.OpeningDate })
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment is null)
            return;

        var studentIds = await GetEnrolledStudentIdsAsync(assignment.SubjectId, cancellationToken);
        if (studentIds.Count == 0)
            return;

        var open = ToUtc(assignment.OpeningDate);
        var now = DateTimeOffset.UtcNow;

        foreach (var studentId in studentIds)
        {
            var prefs = await LoadStudentPreferencesAsync(studentId, cancellationToken);
            if (prefs is null)
                continue;

            var assignmentPrefs = prefs.NewAssignment;
            if (!assignmentPrefs.Enabled || assignmentPrefs.Frequency != "instant")
                continue;

            var user = await _userManager.FindByIdAsync(studentId.ToString());
            if (user?.TelegramChatId is not long chatId)
                continue;

            if (ShouldNotifyOnPublish(assignmentPrefs.Enabled, assignmentPrefs.Frequency, assignmentPrefs.NotifyOn))
            {
                var publishKey = $"student:assignpublished:{studentId}:{assignmentId}";
                await _sender.SendOnceAsync(
                    studentId,
                    chatId,
                    StudentAssignmentPublished(assignment.Title),
                    publishKey,
                    cancellationToken);
            }

            if ((assignmentPrefs.NotifyOn == "opens" || assignmentPrefs.NotifyOn == "both") && open <= now)
            {
                var openKey = $"student:assignopen:{studentId}:{assignmentId}";
                await _sender.SendOnceAsync(
                    studentId,
                    chatId,
                    StudentAssignmentOpened(assignment.Title),
                    openKey,
                    cancellationToken);
            }
        }
    }

    private async Task<IReadOnlyList<Guid>> GetEnrolledStudentIdsAsync(Guid subjectId, CancellationToken cancellationToken) =>
        await _databaseContext.StudentSubjects.AsNoTracking()
            .Where(ss => ss.SubjectId == subjectId)
            .Select(ss => ss.StudentId)
            .Distinct()
            .ToListAsync(cancellationToken);

    private async Task<StudentNotificationPreferencesDto?> LoadStudentPreferencesAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(studentId.ToString());
        if (user is null)
            return null;

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains(RoleStudent))
            return null;

        if (string.IsNullOrWhiteSpace(user.NotificationPreferencesJson))
            return null;

        try
        {
            return (JsonSerializer.Deserialize<NotificationPreferencesDto>(
                user.NotificationPreferencesJson, JsonOpts) ?? new()).Student;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Failed to parse notification preferences for student {StudentId}", studentId);
            return null;
        }
    }

    private static bool ShouldNotifyOnPublish(bool enabled, string frequency, string notifyOn) =>
        enabled && frequency == "instant" && (notifyOn == "published" || notifyOn == "both");
}
