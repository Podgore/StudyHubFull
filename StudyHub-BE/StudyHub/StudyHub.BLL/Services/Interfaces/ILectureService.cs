using StudyHub.Common.DTO.Lecture;

namespace StudyHub.BLL.Services.Interfaces;

public interface ILectureService
{
    Task<LectureDTO> GetLectureByIdForUserAsync(Guid userId, Guid lectureId);
    Task<List<LectureDTO>> GetLecturesBySubjectIdAsync(Guid subjectId);
    Task<LectureDTO> CreateLectureAsync(Guid teacherId, Guid subjectId, CreateLectureDTO dto);
    Task<LectureDTO> UpdateLectureAsync(Guid teacherId, Guid lectureId, UpdateLectureDTO dto);
    Task<bool> DeleteLectureAsync(Guid teacherId, Guid lectureId);
}
