using StudyHub.Common.DTO.TaskVariant;

namespace StudyHub.Common.DTO.AssignmentTaskDTO;

public class CreateAssignmentTaskDTO
{
    public Guid AssignmentId { get; set; }
    public int MaxMark { get; set; }
    public List<CreateTaskVariantDTO> TaskVariants { get; set; } = new List<CreateTaskVariantDTO>();
}