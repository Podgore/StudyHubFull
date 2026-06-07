namespace StudyHub.FluentEmail.MessageBase;

public class ResetPasswordMessage : EmailMessageBase
{
    public override string Subject => "Reset Password";
    public override string TemplateName => nameof(ResetPasswordMessage);
    public string ResetPasswordUri { get; set; } = string.Empty;
}
