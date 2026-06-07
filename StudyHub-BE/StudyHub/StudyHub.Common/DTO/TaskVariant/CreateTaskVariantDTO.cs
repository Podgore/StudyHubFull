using StudyHub.Common.DTO.AssignmentTaskOption;

namespace StudyHub.Common.DTO.TaskVariant;

public class CreateTaskVariantDTO
{
    public string Label { get; set; } = string.Empty;
    public List<CreateTaskOptionDTO> TaskOption { get; set; } = null!;
}
