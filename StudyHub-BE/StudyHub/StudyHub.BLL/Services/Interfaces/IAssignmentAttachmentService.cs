using Microsoft.AspNetCore.Http;
using StudyHub.Common.DTO.Assignment;

namespace StudyHub.BLL.Services.Interfaces;

public interface IAssignmentAttachmentService
{
    Task<AssignmentAttachmentDTO> AddAttachmentAsync(Guid teacherId, Guid assignmentId, IFormFile file);
    Task<bool> DeleteAttachmentAsync(Guid teacherId, Guid attachmentId);
}
