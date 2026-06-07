using StudyHub.Common.DTO.Assignment;

namespace StudyHub.BLL.Services.Interfaces;

public interface IOpenEndedGradingService
{
    Task<List<OpenEndedSubmissionDTO>> GetOpenEndedSubmissionsAsync(Guid teacherId, Guid assignmentId);
    Task<bool> SetOpenEndedMarkAsync(Guid teacherId, SetOpenEndedMarkDTO dto);
}
