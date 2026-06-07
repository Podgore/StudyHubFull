using Hangfire.SqlServer;
using Hangfire;
using StudyHub.Hangfire.Abstractions;
using StudyHub.Hangfire.Services;

namespace StudyHub.Extensions;

public static class HangfireExtension
{
    public static void AddHangfire(this IServiceCollection services, ConfigurationManager configuration)
    {
        services.AddHangfire(
            cfg => cfg.UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection")));

        JobStorage.Current = new SqlServerStorage(configuration.GetConnectionString("DefaultConnection"));

        services.AddHangfireServer();
        services.AddScoped<IHangfireService, HangfireService>();
    }
}
