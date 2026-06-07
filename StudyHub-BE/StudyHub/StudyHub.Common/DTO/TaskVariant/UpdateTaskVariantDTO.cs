using StudyHub.Common.DTO.AssignmentTaskOption;

namespace StudyHub.Common.DTO.TaskVariant;

public class UpdateTaskVariantDTO
{
    public string Label { get; set; } = string.Empty;
    public List<UpdateTaskOptionDTO> TaskOption { get; set; } = null!;
}

