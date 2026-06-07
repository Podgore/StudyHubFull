namespace StudyHub.Common.DTO.Assignment;

public class HomeworkSubmissionDTO
{
    public Guid? Id { get; set; }
    public string? StudentComment { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool CanEdit { get; set; }
    public double? TeacherScore { get; set; }
    public string? TeacherFeedback { get; set; }
    public List<AssignmentAttachmentDTO> Attachments { get; set; } = new();
}