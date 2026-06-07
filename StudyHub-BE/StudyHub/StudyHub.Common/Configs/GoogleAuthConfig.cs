namespace StudyHub.Common.Configs;

public class GoogleAuthConfig : ConfigBase
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    /// <summary>Use postmessage for @react-oauth/google popup + auth-code flow.</summary>
    public string RedirectUri { get; set; } = "postmessage";
    public TimeSpan IssuedAtClockTolerance { get; set; }
    public TimeSpan ExpirationTimeClockTolerance { get; set; }
}