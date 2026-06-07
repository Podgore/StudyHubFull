namespace StudyHub.FluentEmail.MessageBase;

public class InviteUserMessage : EmailMessageBase
{
    public override string Subject => "Invitation";
    public override string TemplateName => nameof(InviteUserMessage);
    public string InviteUserUrl { get; set; } = string.Empty;
}
