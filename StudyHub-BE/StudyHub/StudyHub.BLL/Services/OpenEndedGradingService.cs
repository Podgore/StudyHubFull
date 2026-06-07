using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services;

public class OpenEndedGradingService : IOpenEndedGradingService
{
    private readonly IRepository<Assignment> _assignmentRepository;
    private readonly IRepository<StudentAnswer> _studentAnswerRepository;
    private readonly IAssignmentService _assignmentService;
    private readonly IMapper _mapper;

    public OpenEndedGradingService(
        IRepository<Assignment> assignmentRepository,
        IRepository<StudentAnswer> studentAnswerRepository,
        IAssignmentService assignmentService,
        IMapper mapper)
    {
        _assignmentRepository = assignmentRepository;
        _studentAnswerRepository = studentAnswerRepository;
        _assignmentService = assignmentService;
        _mapper = mapper;
    }

    public async Task<List<OpenEndedSubmissionDTO>> GetOpenEndedSubmissionsAsync(Guid teacherId, Guid assignmentId)
    {
        var assignment = await _assignmentRepository
                .Include(a => a.Subject)
                .Include(a => a.Tasks)
                .ThenInclude(t => t.TaskVariants)
                .ThenInclude(v => v.TaskOption)
                .FirstOrDefaultAsync(a => a.Id == assignmentId)
            ?? throw new NotFoundException($"Assignment not found: {assignmentId}");

        if (assignment.Subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not allowed to view submissions for this assignment.");

        var openVariantIds = assignment.Tasks
            .SelectMany(t => t.TaskVariants)
            .Where(IsOpenEndedVariant)
            .Select(v => v.Id)
            .ToHashSet();

        if (openVariantIds.Count == 0)
            return new List<OpenEndedSubmissionDTO>();

        var answers = await _studentAnswerRepository
            .Include(x => x.User)
            .Include(x => x.TaskVariant)
            .ThenInclude(v => v!.AssignmentTask)
            .Include(x => x.TaskVariant)
            .ThenInclude(v => v!.TaskOption)
            .Where(x => x.TaskVariant!.AssignmentTask!.AssignmentId == assignmentId
                        && openVariantIds.Contains(x.TaskVariantId))
            .ToListAsync();

        var ordered = answers
            .OrderBy(a => a.User?.FullName ?? string.Empty)
            .ThenBy(a => a.TaskVariant!.Label);

        return _mapper.Map<List<OpenEndedSubmissionDTO>>(ordered);
    }

    public async Task<bool> SetOpenEndedMarkAsync(Guid teacherId, SetOpenEndedMarkDTO dto)
    {
        var entity = await _studentAnswerRepository
                .Include(x => x.TaskVariant)
                .ThenInclude(v => v!.TaskOption)
                .Include(x => x.TaskVariant)
                .ThenInclude(v => v!.AssignmentTask)
                .ThenInclude(t => t!.Assignment)
                .ThenInclude(a => a!.Subject)
                .FirstOrDefaultAsync(x => x.Id == dto.StudentAnswerId)
            ?? throw new NotFoundException($"Student answer not found: {dto.StudentAnswerId}");

        var variant = entity.TaskVariant ?? throw new NotFoundException("Task variant not found.");

        if (!IsOpenEndedVariant(variant))
            throw new IncorrectParametersException("This answer is not an open-ended (manually graded) task.");

        if (variant.AssignmentTask?.Assignment?.Subject?.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not allowed to grade this submission.");

        var max = variant.AssignmentTask.MaxMark;
        if (dto.Mark < 0 || dto.Mark > max)
            throw new IncorrectParametersException($"Mark must be between 0 and {max} for this question.");

        entity.Mark = dto.Mark;
        entity.OpenEndedTeacherReviewed = true;
        entity.OpenEndedTeacherFeedback = dto.Feedback;
        await _studentAnswerRepository.UpdateAsync(entity);

        var assignmentId = variant.AssignmentTask.AssignmentId;
        return await _assignmentService.SyncStudentAssignmentTotalMarkAsync(entity.StudentId, assignmentId);
    }

    private static bool IsOpenEndedVariant(TaskVariant variant) =>
        variant.TaskOption.All(o => o.IsCorrect != true);
}
