using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.AssignmentTaskOption;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services.Assignments;

public class OptionsService : IOptionsService
{
    private readonly IRepository<TaskOption> _taskOptionRepository;
    private readonly IAssignmentService _assignmentService;
    private readonly IRepository<StudentAnswer> _studentAnswerRepository;
    private readonly IRepository<TaskVariant> _taskVariantRepository;
    private readonly IMapper _mapper;

    public OptionsService(
        IRepository<TaskOption> taskOptionsRepository,
        IRepository<StudentAnswer> studentAnswerRepository,
        IMapper mapper,
        IRepository<TaskVariant> taskVariantRepository,
        IAssignmentService assignmentService)
    {
        _taskOptionRepository = taskOptionsRepository;
        _studentAnswerRepository = studentAnswerRepository;
        _mapper = mapper;
        _taskVariantRepository = taskVariantRepository;
        _assignmentService = assignmentService;
    }

    public async Task<List<TaskOptionDTO>> AddTaskOptionsAsync(Guid taskVariantId, List<CreateTaskOptionDTO> taskOptions)
    {
        var options = _mapper.Map<List<TaskOption>>(taskOptions).ToList();

        options.ForEach(opt => opt.TaskVariantId = taskVariantId);

        await _taskOptionRepository.InsertManyAsync(options);

        return _mapper.Map<List<TaskOptionDTO>>(options);
    }

    public async Task<TaskOptionDTO> UpdateTaskOptionsAsync(Guid optionId, UpdateTaskOptionDTO taskOptions)
    {
        var entity = await _taskOptionRepository.FirstOrDefaultAsync(x => x.Id == optionId)
            ?? throw new NotFoundException($"Unable to find entity with this key: {optionId}");

        _mapper.Map(taskOptions, entity);

        await _taskOptionRepository.UpdateAsync(entity);

        return _mapper.Map<TaskOptionDTO>(entity);
    }

    public async Task<bool> DeleteTaskOptionsAsync(Guid optionId)
    {
        var entity = await _taskOptionRepository.FirstOrDefaultAsync(x => x.Id == optionId)
           ?? throw new NotFoundException($"Unable to find entity with this key: {optionId}");

        return await _taskOptionRepository.DeleteAsync(entity);
    }

    public async Task<bool> CalculatingChoicesMark(Guid studentId, Guid assignmentId)
    {
        var studentAnswers = await _studentAnswerRepository
            .Include(x => x.TaskOptions)
            .ThenInclude(x => x.TaskVariant)
            .Where(x => x.TaskVariant.AssignmentTask.AssignmentId == assignmentId && x.StudentId == studentId)
            .ToListAsync()
            ?? throw new NotFoundException($"Unable to find entity with this key: {studentId}");

        foreach (var item in studentAnswers)
        {
            var taskVariant = _taskVariantRepository
                .Include(x => x.AssignmentTask)
                .Include(x => x.TaskOption)
                .FirstOrDefault(x => x.Id == item.TaskVariantId)
                ?? throw new NotFoundException($"Unable to find entity with this key: {item.TaskVariantId}");

            var trueOptions = taskVariant.TaskOption.Where(x => x.IsCorrect == true).Count();

            if (trueOptions == 1)
                item.Mark = CalculateMarkForSingleOption(taskVariant, item);

            else if (trueOptions > 1)
                item.Mark = CalculateMarkForMultipleOptions(taskVariant, item);
        }

        var result = await _studentAnswerRepository.UpdateManyAsync(studentAnswers)
            && await _assignmentService.AddMarkForStudentAsync(studentId, assignmentId);

        return result;
    }

    private double CalculateMarkForSingleOption(TaskVariant taskVariant, StudentAnswer studentAnswer)
    {
        var mark = 0.0;

        studentAnswer.TaskOptions.ForEach(option =>
        {
            if (option.IsCorrect == true)
                mark += taskVariant.AssignmentTask.MaxMark;
        });

        return mark;
    }
    private double CalculateMarkForMultipleOptions(TaskVariant taskVariant, StudentAnswer studentAnswer)
    {
        var countOfFalseOptions = studentAnswer.TaskOptions.Where(x => x.IsCorrect == false).Count();
        
        var mark = taskVariant.AssignmentTask.MaxMark - taskVariant.AssignmentTask.MaxMark * ((double)countOfFalseOptions/(double)studentAnswer.TaskOptions.Count());

        return mark;
    }
}