using StudyHub.Common.DTO.Subject;

namespace StudyHub.Common.DTO.StudentGrades;

public class StudentSubjectGradeRowDTO
{
    public Guid SubjectId { get; set; }

    public string SubjectName { get; set; } = string.Empty;

    public AcademicLetterGrade? LetterGrade { get; set; }

    public double? AveragePercent { get; set; }

    public int CompletedAssignments { get; set; }

    public int TotalAssignments { get; set; }
}