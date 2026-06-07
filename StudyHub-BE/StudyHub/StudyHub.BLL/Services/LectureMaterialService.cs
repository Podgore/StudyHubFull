using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StudyHub.BLL.Profiles;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.Configs;
using StudyHub.Common.DTO.Lecture;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services;

public class LectureMaterialService : ILectureMaterialService
{
    private readonly IRepository<Lecture> _lectureRepository;
    private readonly IRepository<LectureMaterial> _lectureMaterialRepository;
    private readonly IRepository<MaterialContent> _materialContentRepository;
    private readonly IRepository<MaterialFile> _materialFileRepository;
    private readonly IRepository<MaterialVideo> _materialVideoRepository;
    private readonly IWebHostEnvironment _env;
    private readonly LectureMaterialsConfig _materialsConfig;
    private readonly IMapper _mapper;

    public LectureMaterialService(
        IRepository<Lecture> lectureRepository,
        IRepository<LectureMaterial> lectureMaterialRepository,
        IRepository<MaterialContent> materialContentRepository,
        IRepository<MaterialFile> materialFileRepository,
        IRepository<MaterialVideo> materialVideoRepository,
        IWebHostEnvironment env,
        IOptions<LectureMaterialsConfig> materialsConfig,
        IMapper mapper)
    {
        _lectureRepository = lectureRepository;
        _lectureMaterialRepository = lectureMaterialRepository;
        _materialContentRepository = materialContentRepository;
        _materialFileRepository = materialFileRepository;
        _materialVideoRepository = materialVideoRepository;
        _env = env;
        _materialsConfig = materialsConfig.Value;
        _mapper = mapper;
    }

    public async Task<LectureMaterialDTO> AddMaterialAsync(Guid teacherId, Guid lectureId, LectureMaterialInputDTO dto)
    {
        await EnsureTeacherOwnsLectureAsync(teacherId, lectureId);

        if (dto.Type == MaterialType.File)
            throw new IncorrectParametersException("Use the file upload endpoint for file materials.");

        var material = await AddNonFileMaterialCoreAsync(lectureId, dto);
        return _mapper.Map<LectureMaterialDTO>(material);
    }

    public async Task<LectureMaterialDTO> AddFileMaterialAsync(Guid teacherId, Guid lectureId, AddLectureFileMaterialRequest request)
    {
        await EnsureTeacherOwnsLectureAsync(teacherId, lectureId);

        var file = request.File;
        var ext = Path.GetExtension(file.FileName);
        if (!_materialsConfig.FileExtensions.Contains(ext.ToLower()))
            throw new IncorrectParametersException("Invalid file extension");

        var lectureDir = Path.Combine(_env.ContentRootPath, "Uploads", _materialsConfig.Folder, lectureId.ToString());
        if (!Directory.Exists(lectureDir))
            Directory.CreateDirectory(lectureDir);

        var storedName = $"{DateTime.UtcNow.Ticks}_{Path.GetFileName(file.FileName)}";
        var physicalPath = Path.Combine(lectureDir, storedName);

        await using (var stream = new FileStream(physicalPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var relativePath = Path.Combine(_materialsConfig.Folder, lectureId.ToString(), storedName)
            .Replace('\\', '/');

        var material = _mapper.Map<LectureMaterial>(request);
        material.LectureId = lectureId;

        await _lectureMaterialRepository.InsertAsync(material);

        var materialFile = _mapper.Map<MaterialFile>(new MaterialFileCreationArgs(material.Id, relativePath, file));
        await _materialFileRepository.InsertAsync(materialFile);

        material.File = materialFile;

        return _mapper.Map<LectureMaterialDTO>(material);
    }

    public async Task<LectureMaterialDTO> AddUploadedVideoMaterialAsync(Guid teacherId, Guid lectureId, AddLectureVideoMaterialRequest request)
    {
        await EnsureTeacherOwnsLectureAsync(teacherId, lectureId);

        var file = request.File;
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = _materialsConfig.VideoFileExtensions.Select(e => e.ToLowerInvariant()).ToList();
        if (!allowed.Contains(ext))
            throw new IncorrectParametersException("Invalid video file extension");

        var lectureDir = Path.Combine(_env.ContentRootPath, "Uploads", _materialsConfig.Folder, lectureId.ToString());
        if (!Directory.Exists(lectureDir))
            Directory.CreateDirectory(lectureDir);

        var storedName = $"{DateTime.UtcNow.Ticks}_v_{Path.GetFileName(file.FileName)}";
        var physicalPath = Path.Combine(lectureDir, storedName);

        await using (var stream = new FileStream(physicalPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var relativePath = Path.Combine(_materialsConfig.Folder, lectureId.ToString(), storedName)
            .Replace('\\', '/');

        var material = _mapper.Map<LectureMaterial>(request);
        material.LectureId = lectureId;

        await _lectureMaterialRepository.InsertAsync(material);

        var video = _mapper.Map<MaterialVideo>(new MaterialVideoCreationArgs(material.Id, relativePath, file));
        await _materialVideoRepository.InsertAsync(video);

        material.Video = video;

        return _mapper.Map<LectureMaterialDTO>(material);
    }

    public async Task<bool> DeleteMaterialAsync(Guid teacherId, Guid materialId)
    {
        var material = await _lectureMaterialRepository
            .Include(m => m.Lecture).ThenInclude(l => l.Subject)
            .Include(m => m.File)
            .Include(m => m.Video)
            .FirstOrDefaultAsync(m => m.Id == materialId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {materialId}");

        if (material.Lecture.Subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        if (material.File != null)
        {
            var absolute = Path.Combine(_env.ContentRootPath, "Uploads", material.File.StoragePath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(absolute))
                File.Delete(absolute);
        }

        if (material.Video != null && !string.IsNullOrEmpty(material.Video.StoragePath))
        {
            var absolute = Path.Combine(_env.ContentRootPath, "Uploads", material.Video.StoragePath.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(absolute))
                File.Delete(absolute);
        }

        return await _lectureMaterialRepository.DeleteAsync(material);
    }

    private async Task<LectureMaterial> AddNonFileMaterialCoreAsync(Guid lectureId, LectureMaterialInputDTO input)
    {
        if (input.Type == MaterialType.File)
            throw new IncorrectParametersException("File materials must be uploaded.");

        var material = new LectureMaterial
        {
            Id = Guid.NewGuid(),
            LectureId = lectureId,
            Title = input.Title,
            Description = input.Description,
            Type = input.Type,
            OrderIndex = input.OrderIndex,
            IsVisible = input.IsVisible
        };

        await _lectureMaterialRepository.InsertAsync(material);

        switch (input.Type)
        {
            case MaterialType.Text:
            case MaterialType.Code:
                await _materialContentRepository.InsertAsync(new MaterialContent
                {
                    Id = Guid.NewGuid(),
                    MaterialId = material.Id,
                    Content = input.Content ?? string.Empty,
                    Language = input.Language
                });
                break;
            case MaterialType.Video:
                if (string.IsNullOrWhiteSpace(input.ExternalUrl))
                    throw new IncorrectParametersException("Video materials require an external URL, or use the video upload endpoint for a file.");
                await _materialVideoRepository.InsertAsync(new MaterialVideo
                {
                    Id = Guid.NewGuid(),
                    MaterialId = material.Id,
                    ExternalUrl = input.ExternalUrl,
                    DurationSeconds = input.DurationSeconds
                });
                break;
            case MaterialType.Link:
                if (string.IsNullOrWhiteSpace(input.ExternalUrl))
                    throw new IncorrectParametersException("Link materials require a URL.");
                await _materialVideoRepository.InsertAsync(new MaterialVideo
                {
                    Id = Guid.NewGuid(),
                    MaterialId = material.Id,
                    ExternalUrl = input.ExternalUrl,
                    DurationSeconds = input.DurationSeconds
                });
                break;
            default:
                throw new IncorrectParametersException("Unsupported material type.");
        }

        return await ReloadMaterialAsync(material.Id);
    }

    private async Task<LectureMaterial> ReloadMaterialAsync(Guid materialId)
    {
        return await _lectureMaterialRepository
            .Include(m => m.File)
            .Include(m => m.Video)
            .Include(m => m.ContentDetail)
            .FirstOrDefaultAsync(m => m.Id == materialId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {materialId}");
    }

    private async Task<Lecture> EnsureTeacherOwnsLectureAsync(Guid teacherId, Guid lectureId)
    {
        var lecture = await _lectureRepository
            .Include(l => l.Subject)
            .FirstOrDefaultAsync(l => l.Id == lectureId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {lectureId}");

        if (lecture.Subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        return lecture;
    }
}
