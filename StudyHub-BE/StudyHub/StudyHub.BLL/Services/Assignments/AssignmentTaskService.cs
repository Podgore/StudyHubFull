using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.AssignmentTaskDTO;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services.Assignments;

public class AssignmentTaskService : IAssignmentTaskService
{
    private readonly IRepository<AssignmentTask> _assignmentTaskRepository;
    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IMapper _mapper;

    public AssignmentTaskService(
        IRepository<AssignmentTask> assignmentTaskRepository,
        IRepository<Assignment> assignmentRepository,
        IMapper mapper)
    {
        _assignmentTaskRepository = assignmentTaskRepository;
        _assignmentRepository = assignmentRepository;
        _mapper = mapper;
    }

    public async Task<AssignmentTaskDTO> AddAssignmentTaskAsync(CreateAssignmentTaskDTO assignmentTask)
    {
        var entity = _mapper.Map<AssignmentTask>(assignmentTask);

        var assignment = await _assignmentRepository.FirstOrDefaultAsync(assignment => assignment.Id == assignmentTask.AssignmentId)
            ?? throw new NotFoundException($"Assignment not found in the database with this ID: {assignmentTask.AssignmentId}");

        var assignmentTasks = await _assignmentTaskRepository.Where(a => a.AssignmentId == assignmentTask.AssignmentId).ToListAsync();

        var isMarkGreater = assignmentTasks.Select(a => a.MaxMark).ToArray().Sum() + assignmentTask.MaxMark > assignment.MaxMark;

        if (isMarkGreater)
            throw new IncorrectParametersException($"The assigned mark exceeds the allowed limit. The sum of all task marks must not exceed the assignment maximum of {assignment.MaxMark}.");

        await _assignmentTaskRepository.InsertAsync(entity);

        var result = _mapper.Map<AssignmentTaskDTO>(entity);

        return result;
    }

    public async Task<bool> DeleteAssignmentTaskAsync(Guid assignmentTaskId)
    {
        var entity = await _assignmentTaskRepository
            .FirstOrDefaultAsync(assignmentTask => assignmentTask.Id == assignmentTaskId)
            ?? throw new KeyNotFoundException($"Unable to find entity with such key {assignmentTaskId}");

        return await _assignmentTaskRepository.DeleteAsync(entity);
    }

    public async Task<List<AssignmentTaskDTO>> GetAssignmentTaskAsync(Guid assignmentId)
    {
        var assignmentExists = await _assignmentRepository.AnyAsync(a => a.Id == assignmentId);
        if (!assignmentExists)
            throw new NotFoundException($"Unable to find entity with such key {assignmentId}");

        var result = await _assignmentTaskRepository
            .Include(assignmentTask => assignmentTask.TaskVariants)
            .ThenInclude(taskVariant => taskVariant.TaskOption)
            .Where(assignmentTask => assignmentTask.AssignmentId == assignmentId)
            .ToListAsync();

        return _mapper.Map<List<AssignmentTaskDTO>>(result);
    }

    public async Task<AssignmentTaskDTO> UpdateAssignmentTaskAsync(Guid assignmentTaskId, UpdateAssignmentTaskDTO assignmentTask)
    {
        var entity = await _assignmentTaskRepository
            .Include(assignmentTask => assignmentTask.Assignment)
            .Include(assignmentTask => assignmentTask.TaskVariants)
            .FirstOrDefaultAsync(assignmentTask => assignmentTask.Id == assignmentTaskId)
            ?? throw new NotFoundException($"Unable to find entity with such key {assignmentTaskId}");

        if (entity.Assignment.OpeningDate <= DateTime.Now)
            throw new ExpiredException($"Unable to update this assignment task with current Id because its already started: {assignmentTaskId}");

        _mapper.Map(assignmentTask, entity);

        await _assignmentTaskRepository.UpdateAsync(entity);

        return _mapper.Map<AssignmentTaskDTO>(entity);
    }
}