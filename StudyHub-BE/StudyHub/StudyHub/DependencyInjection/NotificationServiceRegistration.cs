using Microsoft.Extensions.DependencyInjection;
using StudyHub.BLL.Notifications;
using StudyHub.BLL.Notifications.Interfaces;
using StudyHub.BLL.Notifications.Strategies.Students;
using StudyHub.BLL.Notifications.Strategies.Teachers;
using StudyHub.BLL.Services;
using StudyHub.BLL.Services.Interfaces;

namespace StudyHub.DependencyInjection;

public static class NotificationServiceRegistration
{
    public static IServiceCollection AddStudyHubNotifications(this IServiceCollection services)
    {
        services.AddScoped<ITelegramNotificationSender, TelegramNotificationSender>();
        services.AddScoped<InstantEventNotifier>();
        services.AddScoped<StudentContentInstantNotifier>();

        services.AddScoped<IStudentNotificationStrategy, StudentDeadlineStrategy>();
        services.AddScoped<IStudentNotificationStrategy, StudentLectureReminderStrategy>();
        services.AddScoped<IStudentNotificationStrategy, StudentNewAssignmentStrategy>();

        services.AddScoped<IStudentDailyDigestStrategy, StudentDailyDigestStrategy>();

        services.AddScoped<ITeacherNotificationStrategy, TeacherDeadlineStrategy>();
        services.AddScoped<ITeacherNotificationStrategy, TeacherLectureReminderStrategy>();
        services.AddScoped<ITeacherNotificationStrategy, TeacherLowSubmissionRateStrategy>();
        services.AddScoped<ITeacherNotificationStrategy, TeacherPendingGradingStrategy>();

        services.AddScoped<ITeacherDailyDigestStrategy, TeacherDailyDigestStrategy>();

        services.AddScoped<INotificationDispatchService, NotificationDispatchService>();

        return services;
    }
}
