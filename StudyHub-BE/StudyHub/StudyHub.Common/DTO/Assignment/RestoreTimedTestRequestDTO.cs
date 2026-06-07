namespace StudyHub.Common.DTO.Assignment;

public class RestoreTimedTestRequestDTO
{
    public Guid AssignmentId { get; set; }

    public Guid SessionId { get; set; }

    public string SessionHash { get; set; } = string.Empty;
}
