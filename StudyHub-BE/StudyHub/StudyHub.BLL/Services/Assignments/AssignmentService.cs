using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services.Assignments;

public class AssignmentService : IAssignmentService
{
    private readonly UserManager<User> _userManager;
    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IRepository<Subject> _subjectRepository;
    private readonly IRepository<Lecture> _lectureRepository;
    private readonly IRepository<StudentAnswer> _studentAnswerRepository;
    private readonly IRepository<StartingTimeRecord> _startingTimeRecordRepository;
    private readonly IRepository<StudentSubject> _studentSubjectRepository;
    private readonly IMapper _mapper;
    private readonly INotificationDispatchService _notificationDispatch;

    public AssignmentService(
        UserManager<User> userManager,
        IRepository<Assignment> assignmentRepository,
        IRepository<Subject> subjectRepository,
        IRepository<Lecture> lectureRepository,
        IMapper mapper,
        IRepository<StudentAnswer> studentAnswerRepository,
        IRepository<StartingTimeRecord> startingTimeRecordRepository,
        IRepository<StudentSubject> studentSubjectRepository,
        INotificationDispatchService notificationDispatch)
    {
        _userManager = userManager;
        _assignmentRepository = assignmentRepository;
        _subjectRepository = subjectRepository;
        _lectureRepository = lectureRepository;
        _mapper = mapper;
        _studentAnswerRepository = studentAnswerRepository;
        _startingTimeRecordRepository = startingTimeRecordRepository;
        _studentSubjectRepository = studentSubjectRepository;
        _notificationDispatch = notificationDispatch;
    }

    public async Task<AssignmentDTO> CreateAssignmentAsync(CreateAssignmentDTO assignment)
    {
        _ = await _subjectRepository.FirstOrDefaultAsync(x => x.Id == assignment.SubjectId)
            ?? throw new NotFoundException($"Subject not found in the database with this Id: {assignment.SubjectId}");

        await EnsureLectureMatchesSubjectAsync(assignment.SubjectId, assignment.LectureId);

        var entity = _mapper.Map<Assignment>(assignment);
        entity.Tasks = new List<AssignmentTask>();
        entity.Attachments = new List<AssignmentAttachment>();
        entity.HomeworkSubmissions = new List<HomeworkSubmission>();

        await _assignmentRepository.InsertAsync(entity);

        await _notificationDispatch.NotifyAfterAssignmentPublishedAsync(entity.Id, CancellationToken.None);

        return await GetAssignmentByIdAsync(entity.Id);
    }

    public async Task<bool> DeleteAssignmentAsync(Guid assignmentId)
    {
        var entity = await _assignmentRepository
            .FirstOrDefaultAsync(x => x.Id == assignmentId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {assignmentId}");

        return await _assignmentRepository.DeleteAsync(entity);
    }

    public async Task<AssignmentDTO> GetAssignmentByIdAsync(Guid assignmentId)
    {
        var entity = await _assignmentRepository
            .Include(x => x.Lecture)
            .Include(x => x.Attachments)
            .FirstOrDefaultAsync(x => x.Id == assignmentId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {assignmentId}");

        return _mapper.Map<AssignmentDTO>(entity);
    }

    public async Task<List<AssignmentDTO>> GetAssignmentsBySubjectIdAsync(Guid subjectId)
    {
        var entity = await _subjectRepository
            .Include(x => x.Assignments)
            .ThenInclude(a => a.Lecture)
            .Include(x => x.Assignments)
            .ThenInclude(a => a.Attachments)
            .FirstOrDefaultAsync(x => x.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        return _mapper.Map<List<AssignmentDTO>>(entity.Assignments);
    }

    public async Task<AssignmentDTO> UpdateAssignmentAsync(Guid assignmentId, UpdateAssignmentDTO assignment)
    {
        var entity = await _assignmentRepository.FirstOrDefaultAsync(x => x.Id == assignmentId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {assignmentId}");

        if (entity.OpeningDate <= DateTime.Now)
            throw new ExpiredException($"Unable to update this assignment with current Id because its already started: {assignmentId}");

        await EnsureLectureMatchesSubjectAsync(entity.SubjectId, assignment.LectureId);

        _mapper.Map(assignment, entity);

        await _assignmentRepository.UpdateAsync(entity);

        return await GetAssignmentByIdAsync(entity.Id);
    }

    public async Task<bool> AddMarkForStudentAsync(Guid studentId, Guid assignmentId)
    {
        var studentAnswer = await _studentAnswerRepository
            .Include(x => x.TaskVariant)
            .ThenInclude(x => x.AssignmentTask)
            .Where(x => x.StudentId == studentId && x.TaskVariant.AssignmentTask.AssignmentId == assignmentId)
            .ToListAsync()
            ?? throw new NotFoundException($"Unable to find entity with such key: {studentId} and {assignmentId}");

        var mark = studentAnswer.Sum(x => x.Mark);

        var studentAssignment = await _startingTimeRecordRepository
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.AssignmentId == assignmentId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {studentId} and {assignmentId}");

        studentAssignment.Mark = mark;

        var result = await _startingTimeRecordRepository.UpdateAsync(studentAssignment);

        await AddSubjectMarkAsync(studentId, assignmentId, mark);

        return result;
    }

    public async Task<AssignmentDTO> GetNextAssignmentAsync(Guid userId)
    {
        var assignments = await _studentSubjectRepository
             .Include(x => x.Subject)
             .ThenInclude(x => x.Assignments)
             .Where(x => x.StudentId == userId)
             .SelectMany(x => x.Subject.Assignments)
             .ToListAsync();

        var nextAssignment = assignments
            .Where(x => x.OpeningDate > DateTime.Now)
            .OrderBy(x => x.OpeningDate)
            .FirstOrDefault();

        return _mapper.Map<AssignmentDTO>(nextAssignment);
    }

    public async Task<TimedTestStatusDTO> GetTimedTestStatusForStudentAsync(Guid userId, Guid assignmentId)
    {
        var assignment = await _assignmentRepository.FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {assignmentId}");

        if (assignment.Kind == AssignmentKind.Homework)
            throw new IncorrectParametersException("This assignment is not a timed test.");

        var record = await _startingTimeRecordRepository.FirstOrDefaultAsync(
            x => x.StudentId == userId && x.AssignmentId == assignmentId);

        if (record == null)
            return new TimedTestStatusDTO { IsFinished = false };

        // Match VariantService.GetAssignmentTaskForStudentAsync: finished when submitted or duration elapsed.
        var expired = DateTime.Now - record.StartTime > assignment.Duration;
        var finished = record.IsFinished || expired;

        return new TimedTestStatusDTO { IsFinished = finished };
    }

    public async Task<TimeSpan> GetAssignmentLeftTimeAsync(Guid userId, Guid assignmentId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException($"User with curent Id doesn't exist: {userId}");

        var assignment = await _assignmentRepository.Include(a => a.Tasks).ThenInclude(a => a.TaskVariants).FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Assignment with curent Id doesn't exist: {assignmentId}");

        if (assignment.Kind == AssignmentKind.Homework)
            throw new IncorrectParametersException("This assignment is not a timed test.");

        if (assignment.ClosingDate < DateTime.Now)
            throw new TimeOverException("This assignment is already closet");

        var entireStart = await _startingTimeRecordRepository.FirstOrDefaultAsync(
            x => x.StudentId == userId && x.AssignmentId == assignment.Id);

        if (entireStart == null)
            throw new IncorrectParametersException("Start the timed test session first.");

        if (entireStart.IsFinished)
            return TimeSpan.Zero;

        var remainingTime = assignment.Duration - (DateTime.Now - entireStart.StartTime);

        if (remainingTime <= TimeSpan.Zero)
            return TimeSpan.Zero;

        var roundedSeconds = (int)Math.Round(remainingTime.TotalSeconds) % 60;

        return new TimeSpan(remainingTime.Hours, remainingTime.Minutes, roundedSeconds);
    }
    private async Task AddSubjectMarkAsync(Guid studentId, Guid assignmentId, double mark)
    {
        var studentSubject = await _studentSubjectRepository
            .Include(x => x.Subject)
            .ThenInclude(s => s.Assignments)
            .FirstOrDefaultAsync(x => x.StudentId == studentId &&
                              x.Subject.Assignments.Any(a => a.Id == assignmentId))
            ?? throw new NotFoundException($"Unable to find studentSubject for the given assignment");

        studentSubject.Mark += mark;

        await _studentSubjectRepository.UpdateAsync(studentSubject);
    }

    private async Task StartEntireTestAsync(Guid userId, Guid assignmentId)
    {
        var timeRecord = new StartingTimeRecord
        {
            StartTime = DateTime.Now,
            IsFinished = false,
            StudentId = userId,
            AssignmentId = assignmentId
        };

        await _startingTimeRecordRepository.InsertAsync(timeRecord);
    }

    public async Task<bool> SyncStudentAssignmentTotalMarkAsync(Guid studentId, Guid assignmentId)
    {
        var studentAnswers = await _studentAnswerRepository
            .Include(x => x.TaskVariant)
            .ThenInclude(x => x!.AssignmentTask)
            .Where(x => x.StudentId == studentId && x.TaskVariant!.AssignmentTask!.AssignmentId == assignmentId)
            .ToListAsync();

        var newTotal = studentAnswers.Sum(x => x.Mark);

        var record = await _startingTimeRecordRepository
                .FirstOrDefaultAsync(x => x.StudentId == studentId && x.AssignmentId == assignmentId)
            ?? throw new NotFoundException($"No attempt record for student {studentId} and assignment {assignmentId}");

        var oldTotal = record.Mark;
        record.Mark = newTotal;
        await _startingTimeRecordRepository.UpdateAsync(record);

        var studentSubject = await _studentSubjectRepository
                .Include(x => x.Subject)
                .ThenInclude(s => s.Assignments)
                .FirstOrDefaultAsync(x => x.StudentId == studentId
                    && x.Subject.Assignments.Any(a => a.Id == assignmentId))
            ?? throw new NotFoundException("Student is not enrolled in the subject for this assignment.");

        studentSubject.Mark += newTotal - oldTotal;
        await _studentSubjectRepository.UpdateAsync(studentSubject);

        return true;
    }

    private async Task EnsureLectureMatchesSubjectAsync(Guid subjectId, Guid? lectureId)
    {
        if (!lectureId.HasValue)
            return;

        var lecture = await _lectureRepository.FirstOrDefaultAsync(l => l.Id == lectureId.Value)
            ?? throw new NotFoundException($"Lecture not found: {lectureId}");

        if (lecture.SubjectId != subjectId)
            throw new IncorrectParametersException("Lecture does not belong to this subject.");
    }
}