using StudyHub.Entities;

namespace StudyHub.Common.DTO.Assignment;

public class UpdateAssignmentDTO
{
    public string Title { get; set; } = string.Empty;
    public int MaxMark { get; set; }
    public DateTime OpeningDate { get; set; }
    public DateTime ClosingDate { get; set; }
    public TimeSpan Duration { get; set; }

    public string? Instructions { get; set; }
    public Guid? LectureId { get; set; }
}