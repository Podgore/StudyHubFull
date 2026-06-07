namespace StudyHub.Common.DTO.Subject;

public class TeacherAssignmentColumnDTO
{
    public Guid AssignmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public double MaxMark { get; set; }
    public int Kind { get; set; }
}
