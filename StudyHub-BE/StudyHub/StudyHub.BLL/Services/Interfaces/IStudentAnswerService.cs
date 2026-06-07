using StudyHub.Common.DTO.User.Student;

namespace StudyHub.BLL.Services.Interfaces;

public interface IStudentAnswerService
{
    Task<bool> SaveTimedTestProgressAsync(Guid studentId, StudentAnswerDTO dto);

    Task<bool> UpsertStudentAnswerAsync(Guid studentId, StudentAnswerDTO dto);
}
