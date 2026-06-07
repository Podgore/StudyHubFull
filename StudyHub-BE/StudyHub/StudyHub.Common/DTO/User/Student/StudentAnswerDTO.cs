namespace StudyHub.Common.DTO.User.Student;

public class StudentAnswerDTO
{
    public Guid AssignmentId { get; set; }
    public List<AnswerVariantDTO> AnswerVariants { get; set; } = null!;
}