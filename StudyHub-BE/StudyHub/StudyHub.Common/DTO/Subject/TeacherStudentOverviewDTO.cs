namespace StudyHub.Common.DTO.Subject;

public class TeacherStudentOverviewDTO
{
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public double? AveragePercent { get; set; }
    public AcademicLetterGrade? LetterGrade { get; set; }
    public int CompletedAssignments { get; set; }
    public int TotalAssignments { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public List<TeacherStudentAssignmentGradeDTO> AssignmentGrades { get; set; } = new();
}
