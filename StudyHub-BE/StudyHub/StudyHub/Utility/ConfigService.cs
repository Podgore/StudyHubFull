using StudyHub.Common.Configs;

namespace StudyHub.Utility;

public class ConfigService
{
    private readonly IServiceCollection _services;
    private readonly IConfiguration _configuration;

    public ConfigService(
        IServiceCollection services,
        IConfiguration configuration)
    {
        _services = services;
        _configuration = configuration;
    }

    public ConfigService AddConfig<T>()
            where T : ConfigBase, new()
    {
        T config = new T();

        _configuration.GetSection(typeof(T).Name).Bind(config);
        _services.Configure<T>(_configuration.GetSection(typeof(T).Name));

        _services.AddSingleton(config);

        return this;
    }
}
