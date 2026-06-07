using StudyHub.Common.DTO.Lecture;

namespace StudyHub.BLL.Services.Interfaces;

public interface ILectureMaterialService
{
    Task<LectureMaterialDTO> AddMaterialAsync(Guid teacherId, Guid lectureId, LectureMaterialInputDTO dto);
    Task<LectureMaterialDTO> AddFileMaterialAsync(Guid teacherId, Guid lectureId, AddLectureFileMaterialRequest request);
    Task<LectureMaterialDTO> AddUploadedVideoMaterialAsync(Guid teacherId, Guid lectureId, AddLectureVideoMaterialRequest request);
    Task<bool> DeleteMaterialAsync(Guid teacherId, Guid materialId);
}
