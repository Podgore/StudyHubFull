using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StudyHub.BLL.Notifications;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.Configs;
using StudyHub.Common.DTO.Notifications;
using StudyHub.DAL.EF;
using StudyHub.Entities;
using System.Text.Json;

namespace StudyHub.BLL.Services;

public sealed class NotificationDispatchService : INotificationDispatchService
{
    private const string RoleStudent = "Student";
    private const string RoleTeacher = "Teacher";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private static readonly TimeSpan SchedulePeriod = TimeSpan.FromMinutes(12);

    private readonly ApplicationDbContext _databaseContext;
    private readonly UserManager<User> _userManager;
    private readonly IOptions<TelegramConfig> _telegramCfg;
    private readonly ILogger<NotificationDispatchService> _logger;
    private readonly IEnumerable<IStudentNotificationStrategy> _studentStrategies;
    private readonly IEnumerable<ITeacherNotificationStrategy> _teacherStrategies;
    private readonly IEnumerable<IStudentDailyDigestStrategy> _studentDailyDigestStrategies;
    private readonly IEnumerable<ITeacherDailyDigestStrategy> _teacherDailyDigestStrategies;
    private readonly InstantEventNotifier _instantNotifier;
    private readonly StudentContentInstantNotifier _studentContentNotifier;

    public NotificationDispatchService(
        ApplicationDbContext databaseContext,
        UserManager<User> userManager,
        IOptions<TelegramConfig> telegramCfg,
        ILogger<NotificationDispatchService> logger,
        IEnumerable<IStudentNotificationStrategy> studentStrategies,
        IEnumerable<ITeacherNotificationStrategy> teacherStrategies,
        IEnumerable<IStudentDailyDigestStrategy> studentDailyDigestStrategies,
        IEnumerable<ITeacherDailyDigestStrategy> teacherDailyDigestStrategies,
        InstantEventNotifier instantNotifier,
        StudentContentInstantNotifier studentContentNotifier)
    {
        _databaseContext = databaseContext;
        _userManager = userManager;
        _telegramCfg = telegramCfg;
        _logger = logger;
        _studentStrategies = studentStrategies;
        _teacherStrategies = teacherStrategies;
        _studentDailyDigestStrategies = studentDailyDigestStrategies;
        _teacherDailyDigestStrategies = teacherDailyDigestStrategies;
        _instantNotifier = instantNotifier;
        _studentContentNotifier = studentContentNotifier;
    }

    public async Task RunScheduledNotificationsAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return;

        var now = DateTimeOffset.UtcNow;
        var windowStart = now - SchedulePeriod;

        var userRows = await _userManager.Users.AsNoTracking()
            .Where(u => u.TelegramChatId != null
                        && u.NotificationPreferencesJson != null
                        && u.NotificationPreferencesJson != "")
            .Select(u => new { u.Id, u.TelegramChatId })
            .ToListAsync(cancellationToken);

        foreach (var row in userRows)
        {
            var user = await _userManager.FindByIdAsync(row.Id.ToString());
            if (user?.TelegramChatId is not long chatId)
                continue;

            if (!TryDeserializeNotificationPreferences(user.NotificationPreferencesJson!, out var notificationPreferences))
                continue;

            var roles = await _userManager.GetRolesAsync(user);

            try
            {
                if (roles.Contains(RoleStudent))
                    await DispatchForUserAsync(user, chatId, notificationPreferences, new[] { RoleStudent }, now, windowStart, cancellationToken);
                if (roles.Contains(RoleTeacher))
                    await DispatchForUserAsync(user, chatId, notificationPreferences, new[] { RoleTeacher }, now, windowStart, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Telegram dispatch failed for user {UserId}", user.Id);
            }
        }

        await PruneOldLogsAsync(now.AddDays(-90), cancellationToken);
    }

    public async Task RunDailyDigestNotificationsAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return;

        var now = DateTimeOffset.UtcNow;
        var windowStart = now - TimeSpan.FromDays(1);

        var userRows = await _userManager.Users.AsNoTracking()
            .Where(u => u.TelegramChatId != null
                        && u.NotificationPreferencesJson != null
                        && u.NotificationPreferencesJson != "")
            .Select(u => new { u.Id, u.TelegramChatId })
            .ToListAsync(cancellationToken);

        foreach (var row in userRows)
        {
            var user = await _userManager.FindByIdAsync(row.Id.ToString());
            if (user?.TelegramChatId is not long chatId)
                continue;

            if (!TryDeserializeNotificationPreferences(user.NotificationPreferencesJson!, out var notificationPreferences))
                continue;

            var roles = await _userManager.GetRolesAsync(user);

            try
            {
                if (roles.Contains(RoleStudent))
                    await DispatchDailyDigestForUserAsync(
                        user, chatId, notificationPreferences, new[] { RoleStudent }, now, windowStart, cancellationToken);
                if (roles.Contains(RoleTeacher))
                    await DispatchDailyDigestForUserAsync(
                        user, chatId, notificationPreferences, new[] { RoleTeacher }, now, windowStart, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Telegram daily digest failed for user {UserId}", user.Id);
            }
        }
    }

    public Task NotifyAfterHomeworkSubmissionUpdatedAsync(
        Guid assignmentId,
        Guid homeworkSubmissionId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return Task.CompletedTask;

        return _instantNotifier.NotifyAfterHomeworkSubmissionUpdatedAsync(
            assignmentId, homeworkSubmissionId, cancellationToken);
    }

    public Task NotifyAfterTestSubmittedAsync(
        Guid assignmentId,
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return Task.CompletedTask;

        return _instantNotifier.NotifyAfterTestSubmittedAsync(assignmentId, studentId, cancellationToken);
    }

    public Task NotifyAfterLecturePublishedAsync(Guid lectureId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return Task.CompletedTask;

        return _studentContentNotifier.NotifyLecturePublishedAsync(lectureId, cancellationToken);
    }

    public Task NotifyAfterAssignmentPublishedAsync(Guid assignmentId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_telegramCfg.Value.BotToken))
            return Task.CompletedTask;

        return _studentContentNotifier.NotifyAssignmentPublishedAsync(assignmentId, cancellationToken);
    }

    private async Task DispatchForUserAsync(
        User user,
        long chatId,
        NotificationPreferencesDto notificationPreferences,
        string[] roles,
        DateTimeOffset now,
        DateTimeOffset windowStart,
        CancellationToken cancellationToken)
    {
        var subjectIds = await ResolveSubjectIdsAsync(user.Id, roles, cancellationToken);
        if (subjectIds.Count == 0)
            return;

        var context = new NotificationContext
        {
            User = user,
            ChatId = chatId,
            SubjectIds = subjectIds,
            Preferences = notificationPreferences,
            Now = now,
            WindowStart = windowStart,
            Period = SchedulePeriod,
        };

        if (roles.Contains(RoleStudent))
        {
            foreach (var strategy in _studentStrategies)
                await strategy.ExecuteAsync(context, cancellationToken);
        }
        else
        {
            foreach (var strategy in _teacherStrategies)
                await strategy.ExecuteAsync(context, cancellationToken);
        }
    }

    private async Task DispatchDailyDigestForUserAsync(
        User user,
        long chatId,
        NotificationPreferencesDto notificationPreferences,
        string[] roles,
        DateTimeOffset now,
        DateTimeOffset windowStart,
        CancellationToken cancellationToken)
    {
        var subjectIds = await ResolveSubjectIdsAsync(user.Id, roles, cancellationToken);
        if (subjectIds.Count == 0)
            return;

        var context = new NotificationContext
        {
            User = user,
            ChatId = chatId,
            SubjectIds = subjectIds,
            Preferences = notificationPreferences,
            Now = now,
            WindowStart = windowStart,
            Period = TimeSpan.FromDays(1),
        };

        if (roles.Contains(RoleStudent))
        {
            foreach (var strategy in _studentDailyDigestStrategies)
                await strategy.ExecuteAsync(context, cancellationToken);
        }
        else
        {
            foreach (var strategy in _teacherDailyDigestStrategies)
                await strategy.ExecuteAsync(context, cancellationToken);
        }
    }

    private async Task<IReadOnlyList<Guid>> ResolveSubjectIdsAsync(Guid userId, string[] roles, CancellationToken cancellationToken)
    {
        if (roles.Contains(RoleStudent))
            return await _databaseContext.StudentSubjects.AsNoTracking()
                .Where(studentSubject => studentSubject.StudentId == userId)
                .Select(studentSubject => studentSubject.SubjectId)
                .ToListAsync(cancellationToken);

        if (roles.Contains(RoleTeacher))
            return await _databaseContext.Subjects.AsNoTracking()
                .Where(subject => subject.TeacherId == userId)
                .Select(subject => subject.Id)
                .ToListAsync(cancellationToken);

        return Array.Empty<Guid>();
    }

    private static bool TryDeserializeNotificationPreferences(string json, out NotificationPreferencesDto notificationPreferences)
    {
        try
        {
            notificationPreferences = JsonSerializer.Deserialize<NotificationPreferencesDto>(json, JsonOpts)
                    ?? new NotificationPreferencesDto();
            return true;
        }
        catch
        {
            notificationPreferences = new NotificationPreferencesDto();
            return false;
        }
    }

    private async Task PruneOldLogsAsync(DateTimeOffset olderThan, CancellationToken cancellationToken) =>
        await _databaseContext.TelegramNotificationLogs
            .Where(logEntry => logEntry.SentAt < olderThan)
            .ExecuteDeleteAsync(cancellationToken);
}
