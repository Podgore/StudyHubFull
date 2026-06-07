namespace StudyHub.Common.DTO.UserInvitation;

public class InvitedUserDTO
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}