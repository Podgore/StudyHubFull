using StudyHub.Common.DTO.AssignmentTaskDTO;

namespace StudyHub.BLL.Services.Interfaces.Assignment;

public interface IAssignmentTaskService
{
    Task<AssignmentTaskDTO> AddAssignmentTaskAsync(CreateAssignmentTaskDTO task);

    Task<List<AssignmentTaskDTO>> GetAssignmentTaskAsync(Guid assignmentId);

    Task<AssignmentTaskDTO> UpdateAssignmentTaskAsync(Guid assignmentTaskId, UpdateAssignmentTaskDTO dto);

    Task<bool> DeleteAssignmentTaskAsync(Guid assignmentTaskId);
}