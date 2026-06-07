using StudyHub.Common.DTO.Subject;
using StudyHub.Common.DTO.User.Student;
using StudyHub.Common.Requests;
using StudyHub.Common.Response;

namespace StudyHub.BLL.Services.Interfaces;

public interface ISubjectService
{
    Task<SubjectDTO> AddSubjectAsync(Guid teacherId, CreateSubjectDTO dto);

    Task<SubjectDTO> GetSubjectAsync(Guid subjectId);

    Task<SubjectDTO> UpdateSubjectAsync(Guid userId, Guid subjectId, UpdateSubjectDTO dto);

    Task<bool> DeleteSubjectAsync(Guid userId, Guid subjectId);

    Task<List<SubjectDTO>> GetSubjectsForUserAsync(Guid userId);

    Task<StudentResultResponse> AddStudentsToSubjectAsync(Guid subjectId, Guid teacherId, StudentsToSubjectRequest request);

    Task<bool> DeleteStudentsFromSubjectAsync(Guid subjectId, Guid teacherId, string studentEmail);

    Task<List<StudentDTO>> GetStudentsForSubjectAsync(Guid subjectId);

    Task<TeacherSubjectStudentsOverviewDTO> GetTeacherStudentsOverviewAsync(Guid subjectId, Guid teacherId);

    Task<bool> AddMarkForStudent(Guid teacherId, MarkForSubjectRequest request);

    Task<List<MarksResponse>> GetMarksForUser(Guid studentId);
}