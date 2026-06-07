namespace StudyHub.Common.Configs;

public class JwtConfig : ConfigBase
{
    public string Secret { get; set; } = string.Empty;
    public TimeSpan AccessTokenLifeTime { get; set; }
    public TimeSpan RefreshTokenLifeTime { get; set; }
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
}