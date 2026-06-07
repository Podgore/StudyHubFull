namespace StudyHub.Common.Requests;

public class InviteUsersRequest
{
    public List<string> Emails { get; set; } = null!;
    public string Role { get; set; } = string.Empty;
}