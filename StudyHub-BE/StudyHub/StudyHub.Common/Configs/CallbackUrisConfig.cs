namespace StudyHub.Common.Configs;

public class CallbackUrisConfig : ConfigBase
{
    public string AcceptInvitationUri { get; set; } = string.Empty;
    public string ResetPasswordUri { get; set; } = string.Empty;
}
