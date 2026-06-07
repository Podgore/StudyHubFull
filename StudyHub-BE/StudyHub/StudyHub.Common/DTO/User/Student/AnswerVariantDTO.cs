namespace StudyHub.Common.DTO.User.Student;

public class AnswerVariantDTO
{
    public Guid TaskVariantId { get; set; }
    public string? Answer { get; set; }
    public List<Guid>? TaskOptionIds { get; set; }
}
