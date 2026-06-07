using StudyHub.Common.DTO.StudentGrades;

namespace StudyHub.BLL.Services.Interfaces;

public interface IStudentGradesService
{
    Task<StudentGradesSummaryDTO> GetSummaryAsync(Guid studentId);

    Task<List<StudentSubjectGradeRowDTO>> GetSubjectRowsAsync(Guid studentId);

    Task<List<StudentAssignmentGradeRowDTO>> GetAssignmentsForSubjectAsync(Guid studentId, Guid subjectId);
}
