using AutoMapper;
using Microsoft.EntityFrameworkCore;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.StudentGrades;
using StudyHub.Common.DTO.Subject;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;

namespace StudyHub.BLL.Services;

public class StudentGradesService : IStudentGradesService
{
    private readonly IRepository<StudentSubject> _studentSubjectRepository;
    private readonly IRepository<StartingTimeRecord> _startingTimeRecordRepository;
    private readonly IRepository<HomeworkSubmission> _homeworkSubmissionRepository;
    private readonly IRepository<StudentAnswer> _studentAnswerRepository;
    private readonly IMapper _mapper;

    public StudentGradesService(
        IRepository<StudentSubject> studentSubjectRepository,
        IRepository<StartingTimeRecord> startingTimeRecordRepository,
        IRepository<HomeworkSubmission> homeworkSubmissionRepository,
        IRepository<StudentAnswer> studentAnswerRepository,
        IMapper mapper)
    {
        _studentSubjectRepository = studentSubjectRepository;
        _startingTimeRecordRepository = startingTimeRecordRepository;
        _homeworkSubmissionRepository = homeworkSubmissionRepository;
        _studentAnswerRepository = studentAnswerRepository;
        _mapper = mapper;
    }

    public async Task<StudentGradesSummaryDTO> GetSummaryAsync(Guid studentId)
    {
        var ctx = await LoadGradeContextAsync(studentId);

        var total = 0;
        var completed = 0;
        double gradedEarned = 0;
        double gradedMax = 0;

        foreach (var assignment in ctx.AllAssignments)
        {
            total++;
            if (IsAssignmentCompleted(assignment, ctx.TimeByAssignment, ctx.SubmissionByAssignment))
                completed++;

            if (TryGetGradedPoints(
                    assignment,
                    ctx.TimeByAssignment,
                    ctx.SubmissionByAssignment,
                    ctx.TimedTestsPendingOpenEndedGrading,
                    out var earned,
                    out var max) && max > 0)
            {
                gradedEarned += earned;
                gradedMax += max;
            }
        }

        return new StudentGradesSummaryDTO
        {
            OverallAveragePercent = gradedMax > 0 ? Round1(100 * gradedEarned / gradedMax) : null,
            ActiveSubjects = ctx.Enrollments.Count,
            CompletedAssignments = completed,
            TotalAssignments = total,
            CompletionRatePercent = total > 0 ? Round1(100.0 * completed / total) : null,
        };
    }

    public async Task<List<StudentSubjectGradeRowDTO>> GetSubjectRowsAsync(Guid studentId)
    {
        var ctx = await LoadGradeContextAsync(studentId);
        var rows = new List<StudentSubjectGradeRowDTO>();

        foreach (var enrollment in ctx.Enrollments)
        {
            var assignments = enrollment.Subject.Assignments;
            var total = assignments.Count;
            var completed = 0;
            double gradedEarned = 0;
            double gradedMax = 0;

            foreach (var assignment in assignments)
            {
                if (IsAssignmentCompleted(assignment, ctx.TimeByAssignment, ctx.SubmissionByAssignment))
                    completed++;

                if (TryGetGradedPoints(
                        assignment,
                        ctx.TimeByAssignment,
                        ctx.SubmissionByAssignment,
                        ctx.TimedTestsPendingOpenEndedGrading,
                        out var earnedPts,
                        out var maxPts) && maxPts > 0)
                {
                    gradedEarned += earnedPts;
                    gradedMax += maxPts;
                }
            }

            var averagePercent = gradedMax > 0 ? Round1(100 * gradedEarned / gradedMax) : (double?)null;

            rows.Add(new StudentSubjectGradeRowDTO
            {
                SubjectId = enrollment.Subject.Id,
                SubjectName = enrollment.Subject.Title,
                AveragePercent = averagePercent,
                LetterGrade = averagePercent.HasValue ? AcademicLetterGradeCalculator.FromPercent(averagePercent.Value) : null,
                CompletedAssignments = completed,
                TotalAssignments = total,
            });
        }

        return rows.OrderBy(r => r.SubjectName).ToList();
    }

    public async Task<List<StudentAssignmentGradeRowDTO>> GetAssignmentsForSubjectAsync(Guid studentId, Guid subjectId)
    {
        var ctx = await LoadGradeContextAsync(studentId);
        var enrollment = ctx.Enrollments.FirstOrDefault(e => e.SubjectId == subjectId)
            ?? throw new NotFoundException("Subject not found or you are not enrolled.");

        var list = new List<StudentAssignmentGradeRowDTO>();

        foreach (var assignment in enrollment.Subject.Assignments.OrderByDescending(a => a.ClosingDate))
        {
            var time = ctx.TimeByAssignment.GetValueOrDefault(assignment.Id);
            var submission = ctx.SubmissionByAssignment.GetValueOrDefault(assignment.Id);

            var hasGrade = TryGetGradedPoints(
                assignment,
                ctx.TimeByAssignment,
                ctx.SubmissionByAssignment,
                ctx.TimedTestsPendingOpenEndedGrading,
                out var earnedPts,
                out var maxPts);
            double? scorePercent = null;
            double? pointsEarned = null;
            if (hasGrade && maxPts > 0)
            {
                pointsEarned = earnedPts;
                scorePercent = Round1(100 * earnedPts / maxPts);
            }

            var teacherFeedback = assignment.Kind == AssignmentKind.Homework
                ? submission?.TeacherFeedback
                : ctx.TestFeedbackByAssignment.GetValueOrDefault(assignment.Id);

            var row = _mapper.Map<StudentAssignmentGradeRowDTO>(assignment);
            row.SubmittedAt = GetSubmittedAt(assignment, time, submission);
            row.ScorePercent = scorePercent;
            row.PointsEarned = pointsEarned;
            row.TeacherFeedback = string.IsNullOrWhiteSpace(teacherFeedback) ? null : teacherFeedback.Trim();

            list.Add(row);
        }

        return list;
    }

    private async Task<GradeContext> LoadGradeContextAsync(Guid studentId)
    {
        var enrollments = await _studentSubjectRepository
            .Include(ss => ss.Subject)
            .ThenInclude(s => s.Assignments)
            .Where(ss => ss.StudentId == studentId)
            .ToListAsync();

        var assignmentIds = enrollments
            .SelectMany(e => e.Subject.Assignments.Select(a => a.Id))
            .Distinct()
            .ToList();

        var timeRecords = await _startingTimeRecordRepository
            .Where(r => r.StudentId == studentId && assignmentIds.Contains(r.AssignmentId))
            .ToListAsync();

        var submissions = await _homeworkSubmissionRepository
            .Include(s => s.Attachments)
            .Where(s => s.StudentId == studentId && assignmentIds.Contains(s.AssignmentId))
            .ToListAsync();

        var testFeedbackByAssignment = await LoadTestFeedbackByAssignmentAsync(studentId, assignmentIds);

        var timeByAssignment = timeRecords
            .GroupBy(r => r.AssignmentId)
            .ToDictionary(g => g.Key, g => g.MaxBy(r => r.StartTime)!);

        var submissionByAssignment = submissions
            .GroupBy(s => s.AssignmentId)
            .ToDictionary(g => g.Key, g => g.MaxBy(s => s.UpdatedAt)!);

        var assignmentById = new Dictionary<Guid, Assignment>();
        foreach (var enrollment in enrollments)
        {
            foreach (var a in enrollment.Subject.Assignments)
                assignmentById.TryAdd(a.Id, a);
        }

        var timedTestsPendingOpenEnded = await LoadTimedTestsPendingOpenEndedGradingAsync(
            studentId,
            assignmentIds,
            timeByAssignment,
            assignmentById);

        return new GradeContext(
            enrollments,
            timeByAssignment,
            submissionByAssignment,
            testFeedbackByAssignment,
            timedTestsPendingOpenEnded);
    }

    /// <summary>
    /// Timed tests where the session has ended but at least one open-ended answer still needs teacher review
    /// (same notion as <see cref="Notifications.Strategies.Teachers.TeacherPendingGradingStrategy"/>).
    /// </summary>
    private async Task<HashSet<Guid>> LoadTimedTestsPendingOpenEndedGradingAsync(
        Guid studentId,
        List<Guid> assignmentIds,
        Dictionary<Guid, StartingTimeRecord> timeByAssignment,
        Dictionary<Guid, Assignment> assignmentById)
    {
        if (assignmentIds.Count == 0)
            return new HashSet<Guid>();

        var endedTimedIds = assignmentIds
            .Where(id =>
            {
                if (!assignmentById.TryGetValue(id, out var a) || a.Kind != AssignmentKind.TimedTest)
                    return false;
                var t = timeByAssignment.GetValueOrDefault(id);
                if (t == null)
                    return false;
                return t.IsFinished || DateTime.Now - t.StartTime > a.Duration;
            })
            .ToHashSet();

        if (endedTimedIds.Count == 0)
            return new HashSet<Guid>();

        var answers = await _studentAnswerRepository
            .Where(sa => sa.StudentId == studentId && endedTimedIds.Contains(sa.TaskVariant.AssignmentTask.AssignmentId))
            .Where(sa => !sa.OpenEndedTeacherReviewed)
            .Include(sa => sa.TaskVariant)
            .ThenInclude(tv => tv.TaskOption)
            .Include(sa => sa.TaskVariant)
            .ThenInclude(tv => tv.AssignmentTask)
            .ToListAsync();

        var result = new HashSet<Guid>();
        foreach (var sa in answers)
        {
            var opts = sa.TaskVariant.TaskOption;
            var hasAutoGradableKey = opts.Any(o => o.IsCorrect == true);
            if (!hasAutoGradableKey)
                result.Add(sa.TaskVariant.AssignmentTask.AssignmentId);
        }

        return result;
    }

    private async Task<Dictionary<Guid, string>> LoadTestFeedbackByAssignmentAsync(Guid studentId, List<Guid> assignmentIds)
    {
        var result = new Dictionary<Guid, string>();
        if (assignmentIds.Count == 0)
            return result;

        var answers = await _studentAnswerRepository
            .Where(sa => sa.StudentId == studentId)
            .Include(sa => sa.TaskVariant)
            .ThenInclude(tv => tv.AssignmentTask)
            .Where(sa => assignmentIds.Contains(sa.TaskVariant.AssignmentTask.AssignmentId))
            .ToListAsync();

        foreach (var group in answers.GroupBy(sa => sa.TaskVariant.AssignmentTask.AssignmentId))
        {
            var parts = group
                .Select(sa => sa.OpenEndedTeacherFeedback?.Trim())
                .Where(f => !string.IsNullOrEmpty(f))
                .Distinct(StringComparer.Ordinal)
                .ToList();
            if (parts.Count > 0)
                result[group.Key] = string.Join("\n\n", parts);
        }

        return result;
    }

    private sealed record GradeContext(
        List<StudentSubject> Enrollments,
        Dictionary<Guid, StartingTimeRecord> TimeByAssignment,
        Dictionary<Guid, HomeworkSubmission> SubmissionByAssignment,
        Dictionary<Guid, string> TestFeedbackByAssignment,
        HashSet<Guid> TimedTestsPendingOpenEndedGrading)
    {
        public IEnumerable<Assignment> AllAssignments =>
            Enrollments.SelectMany(e => e.Subject.Assignments);
    }

    private static DateTime? GetSubmittedAt(Assignment assignment, StartingTimeRecord? time, HomeworkSubmission? submission)
    {
        if (assignment.Kind == AssignmentKind.Homework)
        {
            if (submission == null)
                return null;
            if (!HomeworkHasStudentWork(submission) && submission.TeacherScore == null)
                return null;
            return submission.UpdatedAt;
        }

        if (time == null)
            return null;

        if (time.IsFinished || DateTime.Now - time.StartTime > assignment.Duration)
            return time.StartTime;

        return null;
    }

    private static bool IsAssignmentCompleted(
        Assignment assignment,
        Dictionary<Guid, StartingTimeRecord> timeByAssignment,
        Dictionary<Guid, HomeworkSubmission> submissionByAssignment)
    {
        if (assignment.Kind == AssignmentKind.Homework)
        {
            var s = submissionByAssignment.GetValueOrDefault(assignment.Id);
            return s != null && (HomeworkHasStudentWork(s) || s.TeacherScore != null);
        }

        var t = timeByAssignment.GetValueOrDefault(assignment.Id);
        if (t == null)
            return false;

        return t.IsFinished || DateTime.Now - t.StartTime > assignment.Duration;
    }

    private static bool HomeworkHasStudentWork(HomeworkSubmission s) =>
        !string.IsNullOrWhiteSpace(s.StudentComment) || (s.Attachments?.Count ?? 0) > 0;

    private static bool TryGetGradedPoints(
        Assignment assignment,
        Dictionary<Guid, StartingTimeRecord> timeByAssignment,
        Dictionary<Guid, HomeworkSubmission> submissionByAssignment,
        HashSet<Guid> timedTestsPendingOpenEndedGrading,
        out double earned,
        out double max)
    {
        max = assignment.MaxMark;
        earned = 0;

        if (max <= 0)
            return false;

        if (assignment.Kind == AssignmentKind.Homework)
        {
            var s = submissionByAssignment.GetValueOrDefault(assignment.Id);
            if (s?.TeacherScore is not { } score)
                return false;

            earned = score;
            return true;
        }

        var t = timeByAssignment.GetValueOrDefault(assignment.Id);
        if (t is not { IsFinished: true })
            return false;

        if (timedTestsPendingOpenEndedGrading.Contains(assignment.Id))
            return false;

        earned = t.Mark;
        return true;
    }

    private static double Round1(double v) => Math.Round(v * 10) / 10;
}
