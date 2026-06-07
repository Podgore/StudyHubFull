namespace StudyHub.Common.DTO.Subject;

public class TeacherSubjectMetricsDTO
{
    public int TotalStudents { get; set; }
    public int ActiveStudents { get; set; }
    public double? AverageScorePercent { get; set; }
    public double? AverageCompletionPercent { get; set; }
}
