namespace StudyHub.Common.DTO.StudentGrades;

public class StudentGradesSummaryDTO
{
    public double? OverallAveragePercent { get; set; }

    public int ActiveSubjects { get; set; }

    public int CompletedAssignments { get; set; }

    public int TotalAssignments { get; set; }

    public double? CompletionRatePercent { get; set; }
}
