using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.DTO.TaskVariant;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services.Assignments;

public class TimedTestSessionService : ITimedTestSessionService
{
    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IRepository<AssignmentTask> _assignmentTaskRepository;
    private readonly IRepository<TaskVariant> _taskVariantRepository;
    private readonly IRepository<StartingTimeRecord> _startingTimeRecordRepository;
    private readonly IRepository<StudentSubject> _studentSubjectRepository;
    private readonly IRepository<StudentAnswer> _studentAnswerRepository;
    private readonly IMapper _mapper;

    public TimedTestSessionService(
        IRepository<Assignment> assignmentRepository,
        IRepository<AssignmentTask> assignmentTaskRepository,
        IRepository<TaskVariant> taskVariantRepository,
        IRepository<StartingTimeRecord> startingTimeRecordRepository,
        IRepository<StudentSubject> studentSubjectRepository,
        IRepository<StudentAnswer> studentAnswerRepository,
        IMapper mapper)
    {
        _assignmentRepository = assignmentRepository;
        _assignmentTaskRepository = assignmentTaskRepository;
        _taskVariantRepository = taskVariantRepository;
        _startingTimeRecordRepository = startingTimeRecordRepository;
        _studentSubjectRepository = studentSubjectRepository;
        _studentAnswerRepository = studentAnswerRepository;
        _mapper = mapper;
    }

    public async Task<TimedTestSessionDTO> StartTimedTestAsync(Guid studentId, Guid assignmentId)
    {
        var assignment = await GetTimedTestAssignmentOrThrowAsync(assignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);

        var record = await _startingTimeRecordRepository.FirstOrDefaultAsync(
            x => x.StudentId == studentId && x.AssignmentId == assignmentId);

        if (record != null && IsAttemptFinished(record, assignment))
            throw new IncorrectParametersException("Test is finished");

        if (record != null && HasActiveSession(record))
        {
            var tasks = await LoadTasksFromRecordAsync(record);
            return await BuildSessionDtoAsync(record, assignment, tasks);
        }

        var variantIds = await PickVariantIdsAsync(assignmentId);
        var sessionToken = Guid.NewGuid();
        var sessionHash = ComputeSessionHash(studentId, assignmentId, variantIds);

        if (record == null)
        {
            record = new StartingTimeRecord
            {
                StartTime = DateTime.Now,
                IsFinished = false,
                StudentId = studentId,
                AssignmentId = assignmentId,
                SessionToken = sessionToken,
                SessionHash = sessionHash,
                SelectedVariantIdsJson = JsonSerializer.Serialize(variantIds),
            };
            await _startingTimeRecordRepository.InsertAsync(record);
        }
        else
        {
            record.StartTime = DateTime.Now;
            record.IsFinished = false;
            record.SessionToken = sessionToken;
            record.SessionHash = sessionHash;
            record.SelectedVariantIdsJson = JsonSerializer.Serialize(variantIds);
            await _startingTimeRecordRepository.UpdateAsync(record);
        }

        var taskDtos = await MapVariantsToTestTasksAsync(variantIds);
        return await BuildSessionDtoAsync(record, assignment, taskDtos);
    }

    public async Task<TimedTestSessionDTO> RestoreTimedTestAsync(Guid studentId, RestoreTimedTestRequestDTO request)
    {
        var assignment = await GetTimedTestAssignmentOrThrowAsync(request.AssignmentId);
        await EnsureStudentEnrolledAsync(studentId, assignment.SubjectId);

        var record = await _startingTimeRecordRepository.FirstOrDefaultAsync(
            x => x.StudentId == studentId && x.AssignmentId == request.AssignmentId);

        if (record == null
            || record.SessionToken != request.SessionId
            || string.IsNullOrEmpty(record.SessionHash)
            || !string.Equals(record.SessionHash, request.SessionHash, StringComparison.Ordinal))
        {
            throw new IncorrectParametersException("Invalid or expired test session");
        }

        if (IsAttemptFinished(record, assignment))
            throw new IncorrectParametersException("Test is finished");

        if (!HasActiveSession(record))
            throw new IncorrectParametersException("Invalid or expired test session");

        var tasks = await LoadTasksFromRecordAsync(record);
        return await BuildSessionDtoAsync(record, assignment, tasks);
    }

    public async Task<string> GetRemainingTimeAsync(
        Guid studentId,
        Guid assignmentId,
        Guid sessionId,
        string sessionHash)
    {
        var assignment = await GetTimedTestAssignmentOrThrowAsync(assignmentId);

        var record = await _startingTimeRecordRepository.FirstOrDefaultAsync(
            x => x.StudentId == studentId && x.AssignmentId == assignmentId);

        if (record == null
            || record.SessionToken != sessionId
            || string.IsNullOrEmpty(record.SessionHash)
            || !string.Equals(record.SessionHash, sessionHash, StringComparison.Ordinal))
        {
            throw new IncorrectParametersException("Invalid or expired test session");
        }

        if (IsAttemptFinished(record, assignment))
            throw new IncorrectParametersException("Test is finished");

        return FormatRemainingTime(GetRemainingTimeSpan(record, assignment));
    }

    private async Task<Assignment> GetTimedTestAssignmentOrThrowAsync(Guid assignmentId)
    {
        var assignment = await _assignmentRepository.FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {assignmentId}");

        if (assignment.Kind == AssignmentKind.Homework)
            throw new IncorrectParametersException("This assignment is not a timed test.");

        if (assignment.ClosingDate < DateTime.Now)
            throw new TimeOverException("This assignment is already closed");

        return assignment;
    }

    private async Task EnsureStudentEnrolledAsync(Guid studentId, Guid subjectId)
    {
        var enrolled = await _studentSubjectRepository.AnyAsync(
            x => x.StudentId == studentId && x.SubjectId == subjectId);

        if (!enrolled)
            throw new IncorrectParametersException("Student is not enrolled in this subject");
    }

    private static bool IsAttemptFinished(StartingTimeRecord record, Assignment assignment) =>
        record.IsFinished || DateTime.Now - record.StartTime > assignment.Duration;

    private static bool HasActiveSession(StartingTimeRecord record) =>
        record.SessionToken.HasValue
        && !string.IsNullOrEmpty(record.SessionHash)
        && !string.IsNullOrEmpty(record.SelectedVariantIdsJson)
        && record.SelectedVariantIdsJson != "[]";

    private static string ComputeSessionHash(Guid studentId, Guid assignmentId, IReadOnlyList<Guid> variantIds)
    {
        var ordered = variantIds.OrderBy(x => x).ToArray();
        var payload = $"{studentId:N}|{assignmentId:N}|{string.Join(',', ordered.Select(x => x.ToString("N")))}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(bytes);
    }

    private async Task<List<Guid>> PickVariantIdsAsync(Guid assignmentId)
    {
        var taskVariants = await _assignmentTaskRepository
            .Include(assignmentTask => assignmentTask.TaskVariants)
            .Where(assignmentTask => assignmentTask.AssignmentId == assignmentId)
            .Select(x => x.TaskVariants.OrderBy(_ => Guid.NewGuid()).FirstOrDefault())
            .ToListAsync();

        var ids = taskVariants
            .Where(tv => tv != null)
            .Select(tv => tv!.Id)
            .ToList();

        if (ids.Count == 0)
            throw new NotFoundException($"Unable to find test tasks for assignment {assignmentId}");

        return ids;
    }

    private async Task<List<TestTaskDTO>> LoadTasksFromRecordAsync(StartingTimeRecord record)
    {
        var variantIds = DeserializeVariantIds(record.SelectedVariantIdsJson);
        if (variantIds.Count == 0)
            throw new IncorrectParametersException("Invalid or expired test session");

        return await MapVariantsToTestTasksAsync(variantIds);
    }

    private static List<Guid> DeserializeVariantIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<Guid>();

        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(json) ?? new List<Guid>();
        }
        catch (JsonException)
        {
            return new List<Guid>();
        }
    }

    private async Task<List<TestTaskDTO>> MapVariantsToTestTasksAsync(IReadOnlyList<Guid> variantIds)
    {
        var taskVariants = await _taskVariantRepository
            .Include(taskVariant => taskVariant.TaskOption)
            .Where(taskVariant => variantIds.Contains(taskVariant.Id))
            .ToListAsync();

        var ordered = variantIds
            .Select(id => taskVariants.FirstOrDefault(tv => tv.Id == id))
            .Where(tv => tv != null)
            .Cast<TaskVariant>()
            .ToList();

        if (ordered.Count == 0)
            throw new NotFoundException("Unable to load test questions for this session");

        var result = _mapper.Map<List<TestTaskDTO>>(ordered);

        foreach (var dto in result)
        {
            var taskVariant = ordered.First(tv => tv.Id == dto.Id);
            var correctAnswerCount = taskVariant.TaskOption.Count(opt => opt.IsCorrect == true);

            dto.QuestionType = correctAnswerCount switch
            {
                0 => QuestionType.Open,
                1 => QuestionType.Select,
                _ => QuestionType.MultiSelect,
            };
        }

        return result;
    }

    private async Task<TimedTestSessionDTO> BuildSessionDtoAsync(
        StartingTimeRecord record,
        Assignment assignment,
        List<TestTaskDTO> tasks)
    {
        var savedAnswers = await LoadSavedAnswersAsync(record.StudentId, assignment.Id);

        return new TimedTestSessionDTO
        {
            SessionId = record.SessionToken!.Value,
            SessionHash = record.SessionHash!,
            RemainingTime = FormatRemainingTime(GetRemainingTimeSpan(record, assignment)),
            Tasks = tasks,
            SavedAnswers = savedAnswers,
        };
    }

    private async Task<List<SavedTestAnswerDTO>> LoadSavedAnswersAsync(Guid studentId, Guid assignmentId)
    {
        var rows = await _studentAnswerRepository
            .Where(answer => answer.StudentId == studentId
                             && answer.TaskVariant.AssignmentTask.AssignmentId == assignmentId)
            .Include(answer => answer.TaskOptions)
            .AsNoTracking()
            .ToListAsync();

        return rows
            .Select(answer => new SavedTestAnswerDTO
            {
                TaskVariantId = answer.TaskVariantId,
                Answer = answer.Answer,
                TaskOptionIds = answer.TaskOptions.Count > 0
                    ? answer.TaskOptions.Select(option => option.Id).ToList()
                    : null,
            })
            .ToList();
    }

    private static TimeSpan GetRemainingTimeSpan(StartingTimeRecord record, Assignment assignment)
    {
        if (record.IsFinished)
            return TimeSpan.Zero;

        var remaining = assignment.Duration - (DateTime.Now - record.StartTime);
        if (remaining <= TimeSpan.Zero)
            return TimeSpan.Zero;

        var roundedSeconds = (int)Math.Round(remaining.TotalSeconds) % 60;
        return new TimeSpan(remaining.Hours, remaining.Minutes, roundedSeconds);
    }

    private static string FormatRemainingTime(TimeSpan remaining)
    {
        if (remaining <= TimeSpan.Zero)
            return "00:00:00";

        var totalHours = (int)remaining.TotalHours;
        return $"{totalHours:D2}:{remaining.Minutes:D2}:{remaining.Seconds:D2}";
    }
}
