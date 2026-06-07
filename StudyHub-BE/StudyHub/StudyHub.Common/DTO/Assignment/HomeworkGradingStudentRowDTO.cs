namespace StudyHub.Common.DTO.Assignment;

public class HomeworkGradingStudentRowDTO
{
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public HomeworkGrandingStatus Status { get; set; }
    public double? Score { get; set; }
}