using StudyHub.Common.DTO.Assignment;

namespace StudyHub.BLL.Services.Interfaces.Assignment;

public interface ITimedTestSessionService
{
    Task<TimedTestSessionDTO> StartTimedTestAsync(Guid studentId, Guid assignmentId);

    Task<TimedTestSessionDTO> RestoreTimedTestAsync(Guid studentId, RestoreTimedTestRequestDTO request);

    Task<string> GetRemainingTimeAsync(Guid studentId, Guid assignmentId, Guid sessionId, string sessionHash);
}
