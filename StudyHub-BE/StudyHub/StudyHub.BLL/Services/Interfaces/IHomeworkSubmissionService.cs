using Microsoft.AspNetCore.Http;
using StudyHub.Common.DTO.Assignment;

namespace StudyHub.BLL.Services.Interfaces;

public interface IHomeworkSubmissionService
{
    Task<HomeworkSubmissionDTO> GetMySubmissionAsync(Guid studentId, Guid assignmentId);

    Task<HomeworkSubmissionDTO> UpdateMyCommentAsync(Guid studentId, Guid assignmentId, UpdateHomeworkSubmissionCommentDTO dto);

    Task<AssignmentAttachmentDTO> AddMyAttachmentAsync(Guid studentId, Guid assignmentId, IFormFile file);

    Task<bool> DeleteMyAttachmentAsync(Guid studentId, Guid attachmentId);

    Task<HomeworkGradingOverviewDTO> GetHomeworkGradingOverviewAsync(Guid teacherId, Guid assignmentId);

    Task<HomeworkGradingDetailDTO> GetHomeworkGradingDetailAsync(Guid teacherId, Guid assignmentId, Guid studentId);

    Task<HomeworkGradingDetailDTO> GradeHomeworkSubmissionAsync(Guid teacherId, Guid assignmentId, Guid studentId, GradeHomeworkSubmissionDTO dto);
}