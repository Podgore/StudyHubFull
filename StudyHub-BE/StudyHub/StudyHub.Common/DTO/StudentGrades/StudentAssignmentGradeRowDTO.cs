using StudyHub.Entities;

namespace StudyHub.Common.DTO.StudentGrades;

public class StudentAssignmentGradeRowDTO
{
    public Guid AssignmentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public AssignmentKind Kind { get; set; }

    public string TypeLabel { get; set; } = string.Empty;

    public DateTime DueAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public double? ScorePercent { get; set; }

    public double? PointsEarned { get; set; }

    public double MaxPoints { get; set; }

    public string? TeacherFeedback { get; set; }
}
