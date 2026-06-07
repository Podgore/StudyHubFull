using StudyHub.Common.DTO.TaskVariant;

namespace StudyHub.Common.DTO.Assignment;

public class TimedTestSessionDTO
{
    public Guid SessionId { get; set; }

    public string SessionHash { get; set; } = string.Empty;

    /// <summary>Remaining time formatted as HH:mm:ss.</summary>
    public string RemainingTime { get; set; } = string.Empty;

    public List<TestTaskDTO> Tasks { get; set; } = new();

    public List<SavedTestAnswerDTO> SavedAnswers { get; set; } = new();
}
