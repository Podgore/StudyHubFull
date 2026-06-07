namespace StudyHub.Common.DTO.Assignment;

public class HomeworkGradingOverviewDTO
{
    public string AssignmentTitle { get; set; } = string.Empty;
    public double MaxMark { get; set; }
    public int GradedCount { get; set; }
    public int PendingCount { get; set; }
    public int NotSubmittedCount { get; set; }
    public List<HomeworkGradingStudentRowDTO> Students { get; set; } = new();
}
