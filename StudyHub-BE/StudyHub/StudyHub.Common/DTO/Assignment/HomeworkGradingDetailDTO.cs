namespace StudyHub.Common.DTO.Assignment;

public class HomeworkGradingDetailDTO
{
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? StudentComment { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AssignmentAttachmentDTO> Attachments { get; set; } = new();
    public double? TeacherScore { get; set; }
    public string? TeacherFeedback { get; set; }
    public double MaxMark { get; set; }
    public HomeworkGrandingStatus Status { get; set; }
}
