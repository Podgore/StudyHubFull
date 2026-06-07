namespace StudyHub.Common.DTO.Assignment;

public class SavedTestAnswerDTO
{
    public Guid TaskVariantId { get; set; }
    public string? Answer { get; set; }
    public List<Guid>? TaskOptionIds { get; set; }
}
