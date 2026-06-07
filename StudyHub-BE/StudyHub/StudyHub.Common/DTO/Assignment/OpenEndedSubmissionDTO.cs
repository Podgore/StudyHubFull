namespace StudyHub.Common.DTO.Assignment;

public class OpenEndedSubmissionDTO
{
    public Guid StudentAnswerId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public Guid TaskVariantId { get; set; }
    public Guid AssignmentTaskId { get; set; }
    public string QuestionLabel { get; set; } = string.Empty;
    public string? StudentResponse { get; set; }
    public string? ReferenceHint { get; set; }
    public double MaxMark { get; set; }
    public double AwardedMark { get; set; }
    public bool ReviewedByTeacher { get; set; }
    public string? TeacherFeedback { get; set; }
}
