namespace StudyHub.Common.DTO.Assignment;

public class SetOpenEndedMarkDTO
{
    public Guid StudentAnswerId { get; set; }
    public double Mark { get; set; }
    public string? Feedback { get; set; }
}
