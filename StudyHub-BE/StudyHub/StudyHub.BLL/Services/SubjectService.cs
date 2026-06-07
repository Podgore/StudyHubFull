using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.DTO.Subject;
using StudyHub.Common.DTO.User.Student;
using StudyHub.Common.Exceptions;
using StudyHub.Common.Requests;
using StudyHub.Common.Response;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services;

public class SubjectService : ISubjectService
{
    private readonly IRepository<Subject> _subjectRepository;
    private readonly IRepository<StudentSubject> _studentSubjectsRepository;
    private readonly IRepository<StartingTimeRecord> _startingTimeRecordsRepository;
    private readonly IRepository<HomeworkSubmission> _homeworkSubmissionRepository;
    private readonly UserManager<User> _userManager;
    private readonly IMapper _mapper;

    public SubjectService(
        IRepository<Subject> subjectRepository,
        UserManager<User> userManager,
        IMapper mapper,
        IRepository<StudentSubject> studentSubjectsRepository,
        IRepository<StartingTimeRecord> startingTimeRecordsRepository,
        IRepository<HomeworkSubmission> homeworkSubmissionRepository)
    {
        _subjectRepository = subjectRepository;
        _userManager = userManager;
        _mapper = mapper;
        _studentSubjectsRepository = studentSubjectsRepository;
        _startingTimeRecordsRepository = startingTimeRecordsRepository;
        _homeworkSubmissionRepository = homeworkSubmissionRepository;
    }

    public async Task<SubjectDTO> AddSubjectAsync(Guid teacherId, CreateSubjectDTO dto)
    {
        var teacher = await _userManager.FindByIdAsync(teacherId)
            ?? throw new NotFoundException($"Teacher not found in the database with this ID: {teacherId}");

        var entity = _mapper.Map<Subject>(dto);

        entity.Teacher = teacher;

        await _subjectRepository.InsertAsync(entity);

        return _mapper.Map<SubjectDTO>(entity);
    }

    public async Task<SubjectDTO> GetSubjectAsync(Guid subjectId)
    {
        var entity = await _subjectRepository
            .Include(s => s.Teacher)
            .FirstOrDefaultAsync(subject => subject.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        return _mapper.Map<SubjectDTO>(entity);
    }

    public async Task<SubjectDTO> UpdateSubjectAsync(Guid userId, Guid subjectId, UpdateSubjectDTO dto)
    {
        var entity = await _subjectRepository
            .FirstOrDefaultAsync(subject => subject.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        if (entity.TeacherId != userId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        _mapper.Map(dto, entity);

        await _subjectRepository.UpdateAsync(entity);

        return _mapper.Map<SubjectDTO>(entity);
    }

    public async Task<bool> DeleteSubjectAsync(Guid userId, Guid subjectId)
    {
        var entity = await _subjectRepository
            .FirstOrDefaultAsync(subject => subject.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        if (entity.TeacherId != userId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        return await _subjectRepository.DeleteAsync(entity);
    }

    public async Task<List<SubjectDTO>> GetSubjectsForUserAsync(Guid userId)
    {
        var user = await _userManager.Users
            .Include(u => u.TeacherSubjects)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {userId}");

        var roles = await _userManager.GetRolesAsync(user);

        var subjects = roles.First() == "Student"
            ? await _studentSubjectsRepository
                .Include(s => s.Subject)
                .ThenInclude(s => s.Teacher)
                .Where(s => s.StudentId == userId)
                .Select(s => s.Subject)
                .ToListAsync()
            : user.TeacherSubjects;

        return _mapper.Map<List<SubjectDTO>>(subjects);
    }

    public async Task<StudentResultResponse> AddStudentsToSubjectAsync(
        Guid subjectId,
        Guid teacherId,
        StudentsToSubjectRequest request)
    {
        var subject = await _subjectRepository.FirstOrDefaultAsync(s => s.Id == subjectId)
            ?? throw new NotFoundException($"Subject not found with this ID: {subjectId}");

        if (subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        var users = await _userManager.Users
            .Where(u => request.Emails.Contains(u.Email!))
            .Select(u => new { u.Id, u.Email })
            .ToListAsync();

        var foundEmails = users.Select(u => u.Email).ToHashSet();
        var userIdByEmail = users.ToDictionary(u => u.Email!, u => u.Id);

        var userIds = users.Select(u => u.Id).ToList();
        var alreadyEnrolledIds = await _studentSubjectsRepository
            .Where(ss => ss.SubjectId == subjectId && userIds.Contains(ss.StudentId))
            .Select(ss => ss.StudentId)
            .ToListAsync();

        var response = new StudentResultResponse();
        var toInsert = new List<StudentSubject>();

        foreach (var email in request.Emails)
        {
            if (!foundEmails.Contains(email))
            {
                response.Failed.Add(email);
                continue;
            }

            var userId = userIdByEmail[email];

            if (alreadyEnrolledIds.Contains(userId))
            {
                response.AlreadyEnrolled.Add(email);
                continue;
            }

            toInsert.Add(new StudentSubject
            {
                StudentId = userId,
                SubjectId = subjectId
            });

            response.Success.Add(email);
        }

        if (toInsert.Count > 0)
            await _studentSubjectsRepository.InsertManyAsync(toInsert);

        return response;
    }

    public async Task<bool> DeleteStudentsFromSubjectAsync(
        Guid subjectId,
        Guid teacherId,
        string studentEmail)
    {
        var subject = await _subjectRepository
                .FirstOrDefaultAsync(s => s.Id == subjectId)
            ?? throw new NotFoundException($"Subject not found with this ID: {subjectId}");

        if (subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        var user = await _userManager.FindByEmailAsync(studentEmail)
            ?? throw new NotFoundException($"Student not found with current Email: {studentEmail}");

        var entity = await _studentSubjectsRepository
            .FirstOrDefaultAsync(s => s.StudentId == user.Id && s.SubjectId == subject.Id)
            ?? throw new NotFoundException($"Student not exist in current subject: {studentEmail}");

        return await _studentSubjectsRepository.DeleteAsync(entity);
    }

    public async Task<List<StudentDTO>> GetStudentsForSubjectAsync(Guid subjectId)
    {
        var students = await _studentSubjectsRepository
                .Include(s => s.Student)
                .Where(s => s.SubjectId == subjectId)
                .Select(s => s.Student)
                .ToListAsync()
            ?? throw new NotFoundException($"Subject not found with this ID: {subjectId}");

        return _mapper.Map<List<StudentDTO>>(students);
    }

    public async Task<TeacherSubjectStudentsOverviewDTO> GetTeacherStudentsOverviewAsync(Guid subjectId, Guid teacherId)
    {
        var subject = await _subjectRepository
            .AsNoTracking()
            .Include(s => s.Assignments)
            .FirstOrDefaultAsync(s => s.Id == subjectId)
            ?? throw new NotFoundException($"Unable to find entity with such key: {subjectId}");

        if (subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner of this subject.");

        var assignments = subject.Assignments.OrderBy(a => a.ClosingDate).ToList();
        var assignmentIds = assignments.Select(a => a.Id).ToList();

        var assignmentColumns = assignments
            .Select(a => _mapper.Map<TeacherAssignmentColumnDTO>(a))
            .ToList();

        var enrollments = await _studentSubjectsRepository
            .AsNoTracking()
            .Include(ss => ss.Student)
            .Where(ss => ss.SubjectId == subjectId)
            .ToListAsync();

        if (enrollments.Count == 0)
        {
            return new TeacherSubjectStudentsOverviewDTO
            {
                Metrics = new TeacherSubjectMetricsDTO
                {
                    TotalStudents = 0,
                    ActiveStudents = 0,
                    AverageScorePercent = null,
                    AverageCompletionPercent = null,
                },
                Assignments = assignmentColumns,
                Students = new List<TeacherStudentOverviewDTO>(),
            };
        }

        var studentIds = enrollments.Select(e => e.StudentId).ToList();

        var timeRecords = await _startingTimeRecordsRepository
            .AsNoTracking()
            .Where(r => assignmentIds.Contains(r.AssignmentId) && studentIds.Contains(r.StudentId))
            .ToListAsync();

        var submissions = await _homeworkSubmissionRepository
            .AsNoTracking()
            .Include(s => s.Attachments)
            .Where(s => assignmentIds.Contains(s.AssignmentId) && studentIds.Contains(s.StudentId))
            .ToListAsync();

        var timeRecordsByStudent = timeRecords
            .GroupBy(r => r.StudentId)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(r => r.AssignmentId).ToDictionary(ag => ag.Key, ag => ag.MaxBy(r => r.StartTime)!)
            );

        var submissionsByStudent = submissions
            .GroupBy(s => s.StudentId)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(s => s.AssignmentId).ToDictionary(ag => ag.Key, ag => ag.MaxBy(s => s.UpdatedAt)!)
            );

        var emptyTimeRecordDict = new Dictionary<Guid, StartingTimeRecord>();
        var emptySubmissionDict = new Dictionary<Guid, HomeworkSubmission>();

        var rows = new List<TeacherStudentOverviewDTO>(enrollments.Count);

        foreach (var enrollment in enrollments)
        {
            var studentId = enrollment.StudentId;

            var timeDict = timeRecordsByStudent.GetValueOrDefault(studentId) ?? emptyTimeRecordDict;
            var submissionDict = submissionsByStudent.GetValueOrDefault(studentId) ?? emptySubmissionDict;

            var completed = 0;
            double gradedEarned = 0;
            double gradedMax = 0;
            DateTime? lastAct = null;

            foreach (var assignment in assignments)
            {
                if (IsAssignmentCompleted(assignment, timeDict, submissionDict))
                    completed++;

                if (TryGetGradedPoints(assignment, timeDict, submissionDict, out var earned, out var max) && max > 0)
                {
                    gradedEarned += earned;
                    gradedMax += max;
                }

                lastAct = MaxNullable(lastAct, GetActivityTimestamp(assignment, timeDict, submissionDict));
            }

            double? avgPct = gradedMax > 0 ? Round1(100 * gradedEarned / gradedMax) : null;
            if (avgPct == null && enrollment.Mark > 0)
                avgPct = Round1(enrollment.Mark);

            var assignmentGrades = assignments
                .Select(a => BuildStudentAssignmentGrade(a, timeDict.GetValueOrDefault(a.Id), submissionDict.GetValueOrDefault(a.Id)))
                .ToList();

            rows.Add(new TeacherStudentOverviewDTO
            {
                StudentId = studentId,
                FullName = enrollment.Student?.FullName ?? string.Empty,
                Email = enrollment.Student?.Email ?? string.Empty,
                Avatar = null,
                AveragePercent = avgPct,
                LetterGrade = avgPct.HasValue ? AcademicLetterGradeCalculator.FromPercent(avgPct.Value) : null,
                CompletedAssignments = completed,
                TotalAssignments = assignments.Count,
                LastActivityAt = lastAct,
                AssignmentGrades = assignmentGrades,
            });
        }

        var sortedRows = rows.OrderBy(r => r.FullName, StringComparer.OrdinalIgnoreCase).ToList();

        return new TeacherSubjectStudentsOverviewDTO
        {
            Metrics = BuildTeacherMetrics(sortedRows),
            Assignments = assignmentColumns,
            Students = sortedRows
        };
    }
    public async Task<bool> AddMarkForStudent(Guid teacherId, MarkForSubjectRequest request)
    {
        var subject = await _subjectRepository
                .FirstOrDefaultAsync(s => s.Id == request.SubjectId)
            ?? throw new NotFoundException($"Subject not found with this ID: {request.SubjectId}");

        if (subject.TeacherId != teacherId)
            throw new RestrictedAccessException("You are not the owner and do not have permission to perform this action.");

        var studentSubject = await _studentSubjectsRepository
                .FirstOrDefaultAsync(s => s.StudentId == request.StudentId && s.SubjectId == request.SubjectId)
            ?? throw new NotFoundException($"The student does not belong to this subject");

        studentSubject.Mark = request.Mark;

        var result = await _studentSubjectsRepository.UpdateAsync(studentSubject);

        return result;
    }

    public async Task<List<MarksResponse>> GetMarksForUser(Guid studentId)
    {
        var student = await _userManager.FindByIdAsync(studentId)
            ?? throw new NotFoundException($"Student not found with this ID: {studentId}");

        var studentSubjects = await _studentSubjectsRepository
                .Include(s => s.Subject)
                .ThenInclude(s => s.Assignments)
                .Where(s => s.StudentId == studentId)
                .ToListAsync();

        var result = new List<MarksResponse>();

        foreach (var studentSubject in studentSubjects)
        {
            var response = new MarksResponse
            {
                Subject = _mapper.Map<SubjectDTO>(studentSubject.Subject),
                SubjectMark = Math.Round(studentSubject.Mark),
                AssignmentMarks = studentSubject.Subject.Assignments
                    .Select(a =>
                    {
                        var record = _startingTimeRecordsRepository
                            .FirstOrDefault(x => x.StudentId == studentId && x.AssignmentId == a.Id);

                        return new AssignmentMarkDTO
                        {
                            Assignment = _mapper.Map<AssignmentDTO>(a),
                            Mark = record != null ? Math.Round(record.Mark) : 0
                        };
                    })
                    .ToList()
            };
            result.Add(response);
        }

        return result;
    }

    private static HomeworkGrandingStatus ComputeHomeworkGrandingStatus(HomeworkSubmission? submission)
    {
        if (submission?.TeacherScore != null)
            return HomeworkGrandingStatus.Graded;

        var hasContent = submission != null &&
            (!string.IsNullOrWhiteSpace(submission.StudentComment) || (submission.Attachments?.Count ?? 0) > 0);

        if (hasContent)
            return HomeworkGrandingStatus.NeedsGrading;

        return HomeworkGrandingStatus.NotSubmitted;
    }

    private static TeacherSubjectAssignmentGradeStatus HomeworkGrandingStatusToOverview(HomeworkGrandingStatus status) =>
        status switch
        {
            HomeworkGrandingStatus.Graded => TeacherSubjectAssignmentGradeStatus.Graded,
            HomeworkGrandingStatus.NeedsGrading => TeacherSubjectAssignmentGradeStatus.Pending,
            HomeworkGrandingStatus.NotSubmitted => TeacherSubjectAssignmentGradeStatus.NotStarted,
            _ => TeacherSubjectAssignmentGradeStatus.NotStarted,
        };

    private static TeacherSubjectMetricsDTO BuildTeacherMetrics(List<TeacherStudentOverviewDTO> rows)
    {
        var total = rows.Count;
        var active = rows.Count(r => r.CompletedAssignments > 0);

        double? avgScore = null;
        var scored = rows.Where(r => r.AveragePercent.HasValue).Select(r => r.AveragePercent!.Value).ToList();
        if (scored.Count > 0)
            avgScore = Round1(scored.Average());

        double? avgCompletion = null;
        var completionPercents = rows
            .Where(r => r.TotalAssignments > 0)
            .Select(r => 100.0 * r.CompletedAssignments / r.TotalAssignments)
            .ToList();
        if (completionPercents.Count > 0)
            avgCompletion = Round1(completionPercents.Average());

        return new TeacherSubjectMetricsDTO
        {
            TotalStudents = total,
            ActiveStudents = active,
            AverageScorePercent = avgScore,
            AverageCompletionPercent = avgCompletion,
        };
    }

    private static DateTime? MaxNullable(DateTime? a, DateTime? b)
    {
        if (!a.HasValue)
            return b;
        if (!b.HasValue)
            return a;

        return a.Value >= b.Value ? a : b;
    }

    private static DateTime? GetActivityTimestamp(
        Assignment assignment,
        Dictionary<Guid, StartingTimeRecord> timeByAssignment,
        Dictionary<Guid, HomeworkSubmission> submissionByAssignment)
    {
        if (assignment.Kind == AssignmentKind.Homework)
        {
            var submission = submissionByAssignment.GetValueOrDefault(assignment.Id);
            if (submission == null)
                return null;
            if (!HomeworkHasStudentWork(submission) && submission.TeacherScore == null)
                return null;
            return submission.UpdatedAt;
        }

        var timeRecord = timeByAssignment.GetValueOrDefault(assignment.Id);
        if (timeRecord == null)
            return null;
        if (timeRecord.IsFinished || DateTime.Now - timeRecord.StartTime > assignment.Duration)
            return timeRecord.StartTime;
        return null;
    }

    private static bool HomeworkHasStudentWork(HomeworkSubmission submission) =>
        !string.IsNullOrWhiteSpace(submission.StudentComment) || (submission.Attachments?.Count ?? 0) > 0;

    private static bool IsAssignmentCompleted(
        Assignment assignment,
        Dictionary<Guid, StartingTimeRecord> timeByAssignment,
        Dictionary<Guid, HomeworkSubmission> submissionByAssignment)
    {
        if (assignment.Kind == AssignmentKind.Homework)
        {
            var submission = submissionByAssignment.GetValueOrDefault(assignment.Id);
            return submission != null && (HomeworkHasStudentWork(submission) || submission.TeacherScore != null);
        }

        var timeRecord = timeByAssignment.GetValueOrDefault(assignment.Id);
        if (timeRecord == null)
            return false;

        return timeRecord.IsFinished || DateTime.Now - timeRecord.StartTime > assignment.Duration;
    }

    private static bool TryGetGradedPoints(
        Assignment assignment,
        Dictionary<Guid, StartingTimeRecord> timeByAssignment,
        Dictionary<Guid, HomeworkSubmission> submissionByAssignment,
        out double earned,
        out double max)
    {
        max = assignment.MaxMark;
        earned = 0;

        if (max <= 0)
            return false;

        if (assignment.Kind == AssignmentKind.Homework)
        {
            var submission = submissionByAssignment.GetValueOrDefault(assignment.Id);
            if (submission?.TeacherScore is not { } score)
                return false;

            earned = score;
            return true;
        }

        var timeRecord = timeByAssignment.GetValueOrDefault(assignment.Id);
        if (timeRecord is not { IsFinished: true })
            return false;

        earned = timeRecord.Mark;
        return true;
    }

    private static TeacherStudentAssignmentGradeDTO BuildStudentAssignmentGrade(
        Assignment assignment,
        StartingTimeRecord? timeRec,
        HomeworkSubmission? submission)
    {
        var max = assignment.MaxMark;
        var dto = new TeacherStudentAssignmentGradeDTO
        {
            AssignmentId = assignment.Id,
            Max = max,
        };

        if (assignment.Kind == AssignmentKind.Homework)
        {
            var homeworkStatus = ComputeHomeworkGrandingStatus(submission);
            dto.Status = HomeworkGrandingStatusToOverview(homeworkStatus);

            if (homeworkStatus == HomeworkGrandingStatus.Graded && submission?.TeacherScore is { } score)
            {
                dto.Earned = score;
                dto.Percent = max > 0 ? Round1(100.0 * score / max) : null;
                return dto;
            }

            return dto;
        }

        if (timeRec == null)
        {
            dto.Status = TeacherSubjectAssignmentGradeStatus.NotStarted;
            return dto;
        }

        var ended = timeRec.IsFinished || DateTime.Now - timeRec.StartTime > assignment.Duration;
        if (!ended)
        {
            dto.Status = TeacherSubjectAssignmentGradeStatus.InProgress;
            return dto;
        }

        dto.Status = TeacherSubjectAssignmentGradeStatus.Graded;
        dto.Earned = timeRec.Mark;
        dto.Percent = max > 0 ? Round1(100.0 * timeRec.Mark / max) : null;
        return dto;
    }

    private static double Round1(double v) => Math.Round(v * 10) / 10;
}