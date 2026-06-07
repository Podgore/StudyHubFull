using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.User.Student;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.Common.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace StudyHub.BLL.Services;

public class StudentAnswerService : IStudentAnswerService
{
    private readonly IRepository<StudentAnswer> _studentAnswerRepository;
    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IRepository<TaskOption> _taskOptionRepository;
    private readonly IRepository<StartingTimeRecord> _startingTimeRepository;
    private readonly IMapper _mapper;
    private readonly INotificationDispatchService _notificationDispatch;

    public StudentAnswerService(
        IRepository<StudentAnswer> studentAnswerRepository,
        IRepository<Assignment> assignmentRepository,
        IRepository<TaskOption> taskOptionRepository,
        IRepository<StartingTimeRecord> startingTimeRepository,
        IMapper mapper,
        INotificationDispatchService notificationDispatch)
    {
        _studentAnswerRepository = studentAnswerRepository;
        _assignmentRepository = assignmentRepository;
        _taskOptionRepository = taskOptionRepository;
        _startingTimeRepository = startingTimeRepository;
        _mapper = mapper;
        _notificationDispatch = notificationDispatch;
    }

    public async Task<bool> SaveTimedTestProgressAsync(Guid studentId, StudentAnswerDTO dto)
    {
        await ValidateAndThrowStudentAnswersAsync(dto);
        var startTime = await GetActiveStartingRecordOrThrowAsync(studentId, dto.AssignmentId);
        await EnsureTimeRemainingAsync(startTime, dto.AssignmentId);
        await MergeAnswerVariantsAsync(studentId, dto);
        return true;
    }

    public async Task<bool> UpsertStudentAnswerAsync(Guid studentId, StudentAnswerDTO dto)
    {
        await ValidateAndThrowStudentAnswersAsync(dto);
        var startTime = await GetActiveStartingRecordOrThrowAsync(studentId, dto.AssignmentId);
        await EnsureTimeRemainingAsync(startTime, dto.AssignmentId);
        await MergeAnswerVariantsAsync(studentId, dto);

        startTime.IsFinished = true;
        await _startingTimeRepository.UpdateAsync(startTime);

        try
        {
            await _notificationDispatch.NotifyAfterTestSubmittedAsync(dto.AssignmentId, studentId, CancellationToken.None);
        }
        catch
        {
        }

        return true;
    }

    private async Task<StartingTimeRecord> GetActiveStartingRecordOrThrowAsync(Guid studentId, Guid assignmentId)
    {
        var startTime = await _startingTimeRepository.FirstOrDefaultAsync(
                x => x.StudentId == studentId && x.AssignmentId == assignmentId)
            ?? throw new NotFoundException("Starting time not found");

        if (startTime.IsFinished)
            throw new ValidationException("This test has already been submitted.");

        return startTime;
    }

    private async Task EnsureTimeRemainingAsync(StartingTimeRecord startTime, Guid assignmentId)
    {
        var duration = await _assignmentRepository
            .Where(x => x.Id == assignmentId)
            .Select(x => x.Duration)
            .FirstOrDefaultAsync();

        var stillInTime = DateTime.Now - startTime.StartTime < duration;
        if (!stillInTime)
            throw new TimeOverException("Time is over");
    }

    private async Task MergeAnswerVariantsAsync(Guid studentId, StudentAnswerDTO dto)
    {
        var studentAnswers = await _studentAnswerRepository
            .Where(x => x.StudentId == studentId && x.TaskVariant.AssignmentTask.AssignmentId == dto.AssignmentId)
            .Include(x => x.TaskOptions)
            .ToListAsync();

        var inserts = dto.AnswerVariants
            .Where(item => !studentAnswers.Any(x => x.TaskVariantId == item.TaskVariantId))
            .ToList();

        await InsertAnswersAsync(studentId, inserts);

        studentAnswers = await _studentAnswerRepository
            .Where(x => x.StudentId == studentId && x.TaskVariant.AssignmentTask.AssignmentId == dto.AssignmentId)
            .Include(x => x.TaskOptions)
            .ToListAsync();

        foreach (var studentAnswer in studentAnswers)
        {
            var answerVariant = dto.AnswerVariants.FirstOrDefault(d => d.TaskVariantId == studentAnswer.TaskVariantId);
            if (answerVariant == null)
                continue;

            var previous = studentAnswer.Answer;
            studentAnswer.Answer = answerVariant.Answer;
            if (studentAnswer.Answer != null && previous != studentAnswer.Answer)
            {
                studentAnswer.OpenEndedTeacherReviewed = false;
                studentAnswer.OpenEndedTeacherFeedback = null;
            }
        }

        studentAnswers.ForEach(x => x.TaskOptions = new List<TaskOption>());

        var result = await ProcessStudentAnswersAsync(studentAnswers, dto.AnswerVariants);

        await _studentAnswerRepository.UpdateManyAsync(result);
    }

    private async Task<bool> InsertAnswersAsync(Guid studentId, List<AnswerVariantDTO> dto)
    {
        if (dto.Count == 0)
            return true;

        var answers = _mapper.Map<List<StudentAnswer>>(dto);

        answers.ForEach(x =>
        {
            x.StudentId = studentId;
            x.TaskOptions ??= new List<TaskOption>();
        });

        var result = await ProcessStudentAnswersAsync(answers, dto);

        await _studentAnswerRepository.InsertManyAsync(result);

        return true;
    }

    private async Task<List<StudentAnswer>> ProcessStudentAnswersAsync(
        List<StudentAnswer> answers,
        List<AnswerVariantDTO> dto)
    {
        var openEnded = answers.Where(x => x.Answer != null).ToList();
        var choiceAnswers = answers.Where(x => x.Answer == null).ToList();

        foreach (var studentAnswer in choiceAnswers)
        {
            studentAnswer.TaskOptions ??= new List<TaskOption>();

            var variantDto = dto.FirstOrDefault(d => d.TaskVariantId == studentAnswer.TaskVariantId);
            var optionIds = variantDto?.TaskOptionIds;
            if (optionIds == null || optionIds.Count == 0)
                continue;

            var options = await _taskOptionRepository
                .Where(x => optionIds.Contains(x.Id))
                .ToListAsync();

            if (options.Count == 0)
                throw new NotFoundException("Task options not found");

            studentAnswer.TaskOptions.AddRange(options);
        }

        return choiceAnswers.Concat(openEnded).ToList();
    }

    private async Task ValidateAndThrowStudentAnswersAsync(StudentAnswerDTO dto)
    {
        foreach (var item in dto.AnswerVariants)
        {
            if (item.TaskOptionIds == null)
                continue;

            var query = _taskOptionRepository
                .Where(x => item.TaskOptionIds.Contains(x.Id));

            var options = await query.ToListAsync();

            var result = options.All(x => x.TaskVariantId == item.TaskVariantId);

            if (!result)
                throw new ValidationException("TaskOption does not belong to this variant.");
        }
    }
}
