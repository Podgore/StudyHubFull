using StudyHub.Common.DTO.TaskOption;

namespace StudyHub.Common.DTO.TaskVariant;

public class TestTaskDTO
{
    public Guid Id { get; set; }

    public string Label { get; set; } = string.Empty;

    public QuestionType QuestionType { get; set; }

    public List<TestTaskOptionDTO> TaskOption { get; set; } = null!;
}
