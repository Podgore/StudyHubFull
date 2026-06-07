using StudyHub.Entities;

namespace StudyHub.Common.DTO.Assignment;

public class AssignmentDTO
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int MaxMark { get; set; }
    public DateTime OpeningDate { get; set; }
    public DateTime ClosingDate { get; set; }
    public TimeSpan Duration { get; set; }

    public AssignmentKind Kind { get; set; }
    public string? Instructions { get; set; }
    public Guid? LectureId { get; set; }
    public string? LectureTitle { get; set; }
    public List<AssignmentAttachmentDTO> Attachments { get; set; } = new();
}