namespace StudyHub.Common.DTO.Subject;

public class TeacherSubjectStudentsOverviewDTO
{
    public TeacherSubjectMetricsDTO Metrics { get; set; } = null!;
    public List<TeacherAssignmentColumnDTO> Assignments { get; set; } = new();
    public List<TeacherStudentOverviewDTO> Students { get; set; } = new();
}
