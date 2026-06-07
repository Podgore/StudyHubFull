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

public class HomeworkSubmissionService : IHomeworkSubmissionService
{
    private const string FolderSegment = "HomeworkSubmissionFiles";

    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IRepository<StudentSubject> _studentSubjectRepository;
    private readonly IRepository<HomeworkSubmission> _submissionRepository;
    private readonly IRepository<HomeworkSubmissionAttachment> _attachmentRepository;
    private readonly IMapper _mapper;
    private readonly IWebHostEnvironment _env;
    private readonly LectureMaterialsConfig _materialsConfig;
    private readonly INotificationDispatchService _notificationDispatch;

    public HomeworkSubmissionService(
        IRepository<Assignment> assignmentRepository,
        IRepository<StudentSubject> studentSubjectRepository,
        IRepository<HomeworkSubmission> submissionRepository,
        IRepository<HomeworkSubmissionAttachment> attachmentRepository,
        IMapper mapper,
        IWebHostEnvironment env,
        LectureMaterialsConfig materialsConfig,
        INotificationDispatchService notificationDispatch)
    {
        _assignmentRepository = assignmentRepository;
        _studentSubjectRepository = studentSubjectRepository;
        _submissionRepository = submissionRepository;
        _attachmentRepository = attachmentRepository;
        _mapper = mapper;
        _env = env;
        _materialsConfig = materialsConfig;
        _notificationDispatch = notificationDispatch;
    }

    public async Task<HomeworkSubmissionDTO> GetMySubmissionAsync(Guid studentId, Guid assignmentId)
    {
        var assignment = await LoadHomeworkAssignmentAsync(assignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);

        var canEdit = ComputeCanEdit(assignment);

        var submission = await _submissionRepository
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.StudentId == studentId && s.AssignmentId == assignmentId);

        if (submission == null)
        {
            return new HomeworkSubmissionDTO
            {
                Id = null,
                StudentComment = null,
                UpdatedAt = null,
                CanEdit = canEdit,
                TeacherScore = null,
                TeacherFeedback = null,
                Attachments = new List<AssignmentAttachmentDTO>(),
            };
        }

        var dto = _mapper.Map<HomeworkSubmissionDTO>(submission);
        dto.CanEdit = canEdit;
        return dto;
    }

    public async Task<HomeworkSubmissionDTO> UpdateMyCommentAsync(
        Guid studentId,
        Guid assignmentId,
        UpdateHomeworkSubmissionCommentDTO dto)
    {
        var assignment = await LoadHomeworkAssignmentAsync(assignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);
        EnsureEditable(assignment);

        var submission = await GetOrCreateSubmissionAsync(studentId, assignmentId);
        submission.StudentComment = dto.StudentComment;
        submission.UpdatedAt = DateTime.UtcNow;

        await _submissionRepository.UpdateAsync(submission);

        try
        {
            await _notificationDispatch.NotifyAfterHomeworkSubmissionUpdatedAsync(
                assignmentId,
                submission.Id,
                CancellationToken.None);
        }
        catch
        {
        }

        return await GetMySubmissionAsync(studentId, assignmentId);
    }

    public async Task<AssignmentAttachmentDTO> AddMyAttachmentAsync(Guid studentId, Guid assignmentId, IFormFile file)
    {
        var assignment = await LoadHomeworkAssignmentAsync(assignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);
        EnsureEditable(assignment);

        var ext = Path.GetExtension(file.FileName);
        if (!_materialsConfig.FileExtensions.Contains(ext.ToLower()))
            throw new IncorrectParametersException("Invalid file extension");

        var submission = await GetOrCreateSubmissionAsync(studentId, assignmentId);

        var dir = Path.Combine(_env.ContentRootPath, "Uploads", FolderSegment, submission.Id.ToString());
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var storedName = $"{DateTime.UtcNow.Ticks}_{Path.GetFileName(file.FileName)}";
        var physicalPath = Path.Combine(dir, storedName);

        await using (var stream = new FileStream(physicalPath, FileMode.Create))
            await file.CopyToAsync(stream);

        var relativePath = Path.Combine(FolderSegment, submission.Id.ToString(), storedName)
            .Replace('\\', '/');

        var entity = new HomeworkSubmissionAttachment
        {
            Id = Guid.NewGuid(),
            HomeworkSubmissionId = submission.Id,
            FileName = file.FileName,
            StoragePath = relativePath,
            MimeType = string.IsNullOrEmpty(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileSizeBytes = file.Length,
        };

        await _attachmentRepository.InsertAsync(entity);

        submission.UpdatedAt = DateTime.UtcNow;
        await _submissionRepository.UpdateAsync(submission);

        try
        {
            await _notificationDispatch.NotifyAfterHomeworkSubmissionUpdatedAsync(
                assignmentId,
                submission.Id,
                CancellationToken.None);
        }
        catch
        {
        }

        return _mapper.Map<AssignmentAttachmentDTO>(entity);
    }

    public async Task<bool> DeleteMyAttachmentAsync(Guid studentId, Guid attachmentId)
    {
        var entity = await _attachmentRepository
                .Include(x => x.HomeworkSubmission)
                .FirstOrDefaultAsync(x => x.Id == attachmentId)
            ?? throw new NotFoundException($"Attachment not found: {attachmentId}");

        if (entity.HomeworkSubmission.StudentId != studentId)
            throw new RestrictedAccessException("You cannot modify this attachment.");

        var assignment = await _assignmentRepository.FirstOrDefaultAsync(a => a.Id == entity.HomeworkSubmission.AssignmentId)
            ?? throw new NotFoundException("Assignment not found.");

        EnsureEditable(assignment);

        var physical = Path.Combine(_env.ContentRootPath, "Uploads", entity.StoragePath.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(physical))
            File.Delete(physical);

        entity.HomeworkSubmission.UpdatedAt = DateTime.UtcNow;
        await _submissionRepository.UpdateAsync(entity.HomeworkSubmission);

        return await _attachmentRepository.DeleteAsync(entity);
    }

    private async Task<Assignment> LoadHomeworkAssignmentAsync(Guid assignmentId)
    {
        var assignment = await _assignmentRepository.FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Assignment not found: {assignmentId}");

        if (assignment.Kind != AssignmentKind.Homework)
            throw new IncorrectParametersException("Submissions apply only to homework assignments.");

        return assignment;
    }

    private async Task EnsureStudentEnrolledAsync(Guid studentId, Guid subjectId)
    {
        var ok = await _studentSubjectRepository.AnyAsync(ss => ss.StudentId == studentId && ss.SubjectId == subjectId);
        if (!ok)
            throw new RestrictedAccessException("You are not enrolled in this subject.");
    }

    private static bool ComputeCanEdit(Assignment assignment)
    {
        var now = DateTime.Now;
        return now >= assignment.OpeningDate && now <= assignment.ClosingDate;
    }

    private static void EnsureEditable(Assignment assignment)
    {
        if (!ComputeCanEdit(assignment))
            throw new IncorrectParametersException("You cannot change your submission outside the assignment window.");
    }

    private async Task<HomeworkSubmission> GetOrCreateSubmissionAsync(Guid studentId, Guid assignmentId)
    {
        var existing = await _submissionRepository
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.StudentId == studentId && s.AssignmentId == assignmentId);

        if (existing != null)
            return existing;

        var created = new HomeworkSubmission
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            AssignmentId = assignmentId,
            StudentComment = null,
            UpdatedAt = DateTime.UtcNow,
            Attachments = new List<HomeworkSubmissionAttachment>(),
        };

        await _submissionRepository.InsertAsync(created);
        return created;
    }

    public async Task<HomeworkGradingOverviewDTO> GetHomeworkGradingOverviewAsync(Guid teacherId, Guid assignmentId)
    {
        var assignment = await LoadHomeworkAssignmentForTeacherAsync(teacherId, assignmentId);

        var enrollments = await _studentSubjectRepository
                .Include(ss => ss.Student)
                .Where(ss => ss.SubjectId == assignment.SubjectId)
                .OrderBy(ss => ss.Student!.FullName)
                .ToListAsync();

        var submissions = await _submissionRepository
            .Include(s => s.Attachments)
            .Where(s => s.AssignmentId == assignmentId)
            .ToListAsync();

        var byStudent = submissions
            .GroupBy(s => s.StudentId)
            .ToDictionary(g => g.Key, g => g.MaxBy(s => s.UpdatedAt)!);

        var overview = _mapper.Map<HomeworkGradingOverviewDTO>(assignment);

        var rows = new List<HomeworkGradingStudentRowDTO>();
        foreach (var enrollment in enrollments)
        {
            var student = enrollment.Student ?? throw new NotFoundException("Student record missing.");
            byStudent.TryGetValue(student.Id, out var sub);
            var status = ComputeHomeworkStatus(sub);
            var row = _mapper.Map<HomeworkGradingStudentRowDTO>(student);
            row.Status = status;
            row.Score = sub?.TeacherScore;
            rows.Add(row);
        }

        overview.Students = rows;
        overview.GradedCount = rows.Count(r => r.Status == HomeworkGrandingStatus.Graded);
        overview.PendingCount = rows.Count(r => r.Status == HomeworkGrandingStatus.NeedsGrading);
        overview.NotSubmittedCount = rows.Count(r => r.Status == HomeworkGrandingStatus.NotSubmitted);

        return overview;
    }

    public async Task<HomeworkGradingDetailDTO> GetHomeworkGradingDetailAsync(Guid teacherId, Guid assignmentId, Guid studentId)
    {
        var assignment = await LoadHomeworkAssignmentForTeacherAsync(teacherId, assignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);

        var enrollment = await _studentSubjectRepository
                .Include(ss => ss.Student)
                .FirstOrDefaultAsync(ss => ss.SubjectId == assignment.SubjectId && ss.StudentId == studentId)
            ?? throw new NotFoundException("Student is not enrolled in this subject.");

        var student = enrollment.Student ?? throw new NotFoundException("Student record missing.");

        var submission = await _submissionRepository
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.StudentId == studentId && s.AssignmentId == assignmentId);

        var status = ComputeHomeworkStatus(submission);

        var dto = _mapper.Map<HomeworkGradingDetailDTO>(student);
        if (submission != null)
            _mapper.Map(submission, dto);
        dto.MaxMark = assignment.MaxMark;
        dto.Status = status;

        return dto;
    }

    public async Task<HomeworkGradingDetailDTO> GradeHomeworkSubmissionAsync(
        Guid teacherId,
        Guid assignmentId,
        Guid studentId,
        GradeHomeworkSubmissionDTO dto)
    {
        var assignment = await LoadHomeworkAssignmentForTeacherAsync(teacherId, assignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);

        if (dto.Score < 0 || dto.Score > assignment.MaxMark + 1e-9)
            throw new IncorrectParametersException($"Score must be between 0 and {assignment.MaxMark}.");

        var submission = await _submissionRepository
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.StudentId == studentId && s.AssignmentId == assignmentId);

        if (submission == null)
        {
            submission = new HomeworkSubmission
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                AssignmentId = assignmentId,
                StudentComment = null,
                UpdatedAt = DateTime.UtcNow,
                Attachments = new List<HomeworkSubmissionAttachment>(),
            };
            await _submissionRepository.InsertAsync(submission);
        }

        submission.TeacherScore = dto.Score;
        submission.TeacherFeedback = dto.TeacherFeedback;
        submission.UpdatedAt = DateTime.UtcNow;
        await _submissionRepository.UpdateAsync(submission);

        return await GetHomeworkGradingDetailAsync(teacherId, assignmentId, studentId);
    }

    private async Task<Assignment> LoadHomeworkAssignmentForTeacherAsync(Guid teacherId, Guid assignmentId)
    {
        var assignment = await _assignmentRepository
                .Include(a => a.Subject)
                .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Assignment not found: {assignmentId}");

        if (assignment.Kind != AssignmentKind.Homework)
            throw new IncorrectParametersException("Grading overview applies only to homework assignments.");

        if (assignment.Subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not allowed to grade this assignment.");

        return assignment;
    }

    private static HomeworkGrandingStatus ComputeHomeworkStatus(HomeworkSubmission? submission)
    {
        if (submission?.TeacherScore != null)
            return HomeworkGrandingStatus.Graded;

        var hasContent = submission != null &&
            (!string.IsNullOrWhiteSpace(submission.StudentComment) || submission.Attachments.Count > 0);

        if (hasContent)
            return HomeworkGrandingStatus.NeedsGrading;

        return HomeworkGrandingStatus.NotSubmitted;
    }
}