using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.Lecture;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services;

public class LectureService : ILectureService
{
    private readonly IRepository<Lecture> _lectureRepository;
    private readonly IRepository<Subject> _subjectRepository;
    private readonly IRepository<StudentSubject> _studentSubjectRepository;
    private readonly ILectureMaterialService _lectureMaterialService;
    private readonly IMapper _mapper;
    private readonly INotificationDispatchService _notificationDispatch;

    public LectureService(
        IRepository<Lecture> lectureRepository,
        IRepository<Subject> subjectRepository,
        IRepository<StudentSubject> studentSubjectRepository,
        ILectureMaterialService lectureMaterialService,
        IMapper mapper,
        INotificationDispatchService notificationDispatch)
    {
        _lectureRepository = lectureRepository;
        _subjectRepository = subjectRepository;
        _studentSubjectRepository = studentSubjectRepository;
        _lectureMaterialService = lectureMaterialService;
        _mapper = mapper;
        _notificationDispatch = notificationDispatch;
    }

    public async Task<LectureDTO> GetLectureByIdForUserAsync(Guid userId, Guid lectureId)
    {
        var lecture = await _lectureRepository
            .Include(l => l.Subject)
            .Include(l => l.Materials).ThenInclude(m => m.File)
            .Include(l => l.Materials).ThenInclude(m => m.Video)
            .Include(l => l.Materials).ThenInclude(m => m.ContentDetail)
            .FirstOrDefaultAsync(l => l.Id == lectureId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {lectureId}");

        await EnsureUserCanAccessLectureAsync(userId, lecture);

        return _mapper.Map<LectureDTO>(lecture);
    }

    public async Task<List<LectureDTO>> GetLecturesBySubjectIdAsync(Guid subjectId)
    {
        _ = await _subjectRepository.FirstOrDefaultAsync(s => s.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        var lectures = await _lectureRepository
            .Include(l => l.Materials).ThenInclude(m => m.File)
            .Include(l => l.Materials).ThenInclude(m => m.Video)
            .Include(l => l.Materials).ThenInclude(m => m.ContentDetail)
            .Where(l => l.SubjectId == subjectId)
            .OrderBy(l => l.LectureDate)
            .ThenBy(l => l.Title)
            .ToListAsync();

        return lectures.Select(_mapper.Map<LectureDTO>).ToList();
    }

    public async Task<LectureDTO> CreateLectureAsync(Guid teacherId, Guid subjectId, CreateLectureDTO dto)
    {
        await EnsureTeacherOwnsSubjectAsync(teacherId, subjectId);

        var lecture = new Lecture
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            LectureDate = dto.LectureDate,
            SubjectId = subjectId,
            Materials = new List<LectureMaterial>()
        };

        await _lectureRepository.InsertAsync(lecture);

        foreach (var item in dto.Materials)
            await _lectureMaterialService.AddMaterialAsync(teacherId, lecture.Id, item);

        await _notificationDispatch.NotifyAfterLecturePublishedAsync(lecture.Id, CancellationToken.None);

        return await GetLectureDtoByIdAsync(lecture.Id);
    }

    public async Task<LectureDTO> UpdateLectureAsync(Guid teacherId, Guid lectureId, UpdateLectureDTO dto)
    {
        var lecture = await EnsureTeacherOwnsLectureAsync(teacherId, lectureId);

        lecture.Title = dto.Title;
        lecture.Description = dto.Description;
        lecture.LectureDate = dto.LectureDate;

        await _lectureRepository.UpdateAsync(lecture);

        return await GetLectureDtoByIdAsync(lectureId);
    }

    public async Task<bool> DeleteLectureAsync(Guid teacherId, Guid lectureId)
    {
        var lecture = await EnsureTeacherOwnsLectureAsync(teacherId, lectureId);
        return await _lectureRepository.DeleteAsync(lecture);
    }

    private async Task<LectureDTO> GetLectureDtoByIdAsync(Guid lectureId)
    {
        var lecture = await _lectureRepository
            .Include(l => l.Materials).ThenInclude(m => m.File)
            .Include(l => l.Materials).ThenInclude(m => m.Video)
            .Include(l => l.Materials).ThenInclude(m => m.ContentDetail)
            .FirstOrDefaultAsync(l => l.Id == lectureId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {lectureId}");

        return _mapper.Map<LectureDTO>(lecture);
    }

    private async Task EnsureTeacherOwnsSubjectAsync(Guid teacherId, Guid subjectId)
    {
        var subject = await _subjectRepository.FirstOrDefaultAsync(s => s.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        if (subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");
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

    private async Task EnsureUserCanAccessLectureAsync(Guid userId, Lecture lecture)
    {
        if (lecture.Subject.TeacherId == userId)
            return;

        var enrolled = await _studentSubjectRepository.FirstOrDefaultAsync(ss =>
            ss.StudentId == userId && ss.SubjectId == lecture.SubjectId);

        if (enrolled != null)
            return;

        throw new RestrictedAccessException("You do not have access to this lecture.");
    }
}
