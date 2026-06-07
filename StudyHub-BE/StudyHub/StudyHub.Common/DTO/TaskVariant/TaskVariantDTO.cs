using StudyHub.Common.DTO.AssignmentTaskOption;

namespace StudyHub.Common.DTO.TaskVariant;

public class TaskVariantDTO
{
    public string Label { get; set; } = string.Empty;
    public List<TaskOptionDTO> TaskOption { get; set; } = null!;
}
