namespace StudyHub.Common.DTO.Subject;

public class TeacherStudentAssignmentGradeDTO
{
    public Guid AssignmentId { get; set; }
    public TeacherSubjectAssignmentGradeStatus Status { get; set; } = TeacherSubjectAssignmentGradeStatus.NotStarted;
    public double? Earned { get; set; }
    public double? Max { get; set; }
    public double? Percent { get; set; }
}
