using StudyHub.Utility;

namespace StudyHub.Extensions;

public static class ConfigExtension
{
    public static IServiceCollection ConfigsAssembly(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<ConfigService> configService)
    {
        var builder = new ConfigService(services, configuration);
        configService(builder);

        return services;
    }
}
