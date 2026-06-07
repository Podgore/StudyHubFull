using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.Configs;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services;

public class AssignmentAttachmentService : IAssignmentAttachmentService
{
    private const string AssignmentFilesFolder = "AssignmentFiles";

    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IRepository<AssignmentAttachment> _attachmentRepository;
    private readonly IMapper _mapper;
    private readonly IWebHostEnvironment _env;
    private readonly LectureMaterialsConfig _materialsConfig;

    public AssignmentAttachmentService(
        IRepository<Assignment> assignmentRepository,
        IRepository<AssignmentAttachment> attachmentRepository,
        IMapper mapper,
        IWebHostEnvironment env,
        LectureMaterialsConfig materialsConfig)
    {
        _assignmentRepository = assignmentRepository;
        _attachmentRepository = attachmentRepository;
        _mapper = mapper;
        _env = env;
        _materialsConfig = materialsConfig;
    }

    public async Task<AssignmentAttachmentDTO> AddAttachmentAsync(Guid teacherId, Guid assignmentId, IFormFile file)
    {
        var assignment = await _assignmentRepository
                .Include(a => a.Subject)
                .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Assignment not found: {assignmentId}");

        if (assignment.Subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You cannot modify this assignment.");

        if (assignment.Kind != AssignmentKind.Homework)
            throw new IncorrectParametersException("Files can only be attached to homework-style assignments.");

        var ext = Path.GetExtension(file.FileName);
        if (!_materialsConfig.FileExtensions.Contains(ext.ToLower()))
            throw new IncorrectParametersException("Invalid file extension");

        var dir = Path.Combine(_env.ContentRootPath, "Uploads", AssignmentFilesFolder, assignmentId.ToString());
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var storedName = $"{DateTime.UtcNow.Ticks}_{Path.GetFileName(file.FileName)}";
        var physicalPath = Path.Combine(dir, storedName);

        await using (var stream = new FileStream(physicalPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var relativePath = Path.Combine(AssignmentFilesFolder, assignmentId.ToString(), storedName)
            .Replace('\\', '/');

        var entity = new AssignmentAttachment
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignmentId,
            FileName = file.FileName,
            StoragePath = relativePath,
            MimeType = string.IsNullOrEmpty(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileSizeBytes = file.Length,
        };

        await _attachmentRepository.InsertAsync(entity);

        return _mapper.Map<AssignmentAttachmentDTO>(entity);
    }

    public async Task<bool> DeleteAttachmentAsync(Guid teacherId, Guid attachmentId)
    {
        var entity = await _attachmentRepository
                .Include(x => x.Assignment)
                .ThenInclude(a => a.Subject)
                .FirstOrDefaultAsync(x => x.Id == attachmentId)
            ?? throw new NotFoundException($"Attachment not found: {attachmentId}");

        if (entity.Assignment.Subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You cannot modify this assignment.");

        var physical = Path.Combine(_env.ContentRootPath, "Uploads", entity.StoragePath.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(physical))
            File.Delete(physical);

        return await _attachmentRepository.DeleteAsync(entity);
    }
}
