using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.DTO.User.Student;

namespace StudyHub.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AssignmentController : Controller
{
    private readonly IAssignmentService _assignmentService;
    private readonly IStudentAnswerService _studentAnswerService;
    private readonly IOptionsService _optionService;
    private readonly IOpenEndedGradingService _openEndedGradingService;
    private readonly IAssignmentAttachmentService _assignmentAttachmentService;
    private readonly IHomeworkSubmissionService _homeworkSubmissionService;
    private readonly ITimedTestSessionService _timedTestSessionService;

    public AssignmentController(
        IAssignmentService assignmentService,
        IStudentAnswerService studentAnswerService,
        IOptionsService optionService,
        IOpenEndedGradingService openEndedGradingService,
        IAssignmentAttachmentService assignmentAttachmentService,
        IHomeworkSubmissionService homeworkSubmissionService,
        ITimedTestSessionService timedTestSessionService)
    {
        _assignmentService = assignmentService;
        _studentAnswerService = studentAnswerService;
        _optionService = optionService;
        _openEndedGradingService = openEndedGradingService;
        _assignmentAttachmentService = assignmentAttachmentService;
        _homeworkSubmissionService = homeworkSubmissionService;
        _timedTestSessionService = timedTestSessionService;
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> InsertAssignment(CreateAssignmentDTO dto)
    {
        var result = await _assignmentService.CreateAssignmentAsync(dto);
        return Ok(result);
    }

    [HttpPut("{assignmentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateAssignment(Guid assignmentId, UpdateAssignmentDTO dto)
    {
        var result = await _assignmentService.UpdateAssignmentAsync(assignmentId, dto);
        return Ok(result);
    }

    [HttpDelete("{assignmentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteAssignment(Guid assignmentId)
    {
        return await _assignmentService.DeleteAssignmentAsync(assignmentId) ? NoContent() : NotFound();
    }

    [HttpGet("{assignmentId}")]
    public async Task<IActionResult> GetAssignment(Guid assignmentId)
    {
        var result = await _assignmentService.GetAssignmentByIdAsync(assignmentId);
        return Ok(result);
    }

    [HttpGet("{assignmentId}/timed-test-status")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetTimedTestStatus(Guid assignmentId)
    {
        var userId = HttpContext.GetUserId();
        var result = await _assignmentService.GetTimedTestStatusForStudentAsync(userId, assignmentId);
        return Ok(result);
    }

    [HttpPost("save-timed-test-progress")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SaveTimedTestProgress(StudentAnswerDTO dto)
    {
        var studentId = HttpContext.GetUserId();
        var result = await _studentAnswerService.SaveTimedTestProgressAsync(studentId, dto);
        return result ? Ok() : BadRequest();
    }

    [HttpPost("student-answer")]
    public async Task<IActionResult> UpsertStudentAnswer(StudentAnswerDTO dto)
    {
        var studentId = HttpContext.GetUserId();

        var result = await _studentAnswerService.UpsertStudentAnswerAsync(studentId, dto)
            && await _optionService.CalculatingChoicesMark(studentId, dto.AssignmentId);

        return result ? Ok() : BadRequest();
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> NextAssignment()
    {
        var studentId = HttpContext.GetUserId();

        var result = await _assignmentService.GetNextAssignmentAsync(studentId);

        return Ok(result);
    }

    [HttpPost("start-timed-test/{assignmentId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> StartTimedTest(Guid assignmentId)
    {
        var userId = HttpContext.GetUserId();
        var result = await _timedTestSessionService.StartTimedTestAsync(userId, assignmentId);
        return Ok(result);
    }

    [HttpPost("restore-timed-test")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> RestoreTimedTest([FromBody] RestoreTimedTestRequestDTO request)
    {
        var userId = HttpContext.GetUserId();
        var result = await _timedTestSessionService.RestoreTimedTestAsync(userId, request);
        return Ok(result);
    }

    [HttpGet("starting-test/{assignmentId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetTimedTestRemainingTime(
        Guid assignmentId,
        [FromQuery] Guid sessionId,
        [FromQuery] string sessionHash)
    {
        var userId = HttpContext.GetUserId();
        var result = await _timedTestSessionService.GetRemainingTimeAsync(
            userId, assignmentId, sessionId, sessionHash);
        return Ok(result);
    }

    [HttpGet("{assignmentId}/open-ended-submissions")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetOpenEndedSubmissions(Guid assignmentId)
    {
        var teacherId = HttpContext.GetUserId();
        var result = await _openEndedGradingService.GetOpenEndedSubmissionsAsync(teacherId, assignmentId);
        return Ok(result);
    }

    [HttpPut("open-ended-mark")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> SetOpenEndedMark(SetOpenEndedMarkDTO dto)
    {
        var teacherId = HttpContext.GetUserId();
        var ok = await _openEndedGradingService.SetOpenEndedMarkAsync(teacherId, dto);
        return ok ? Ok() : BadRequest();
    }

    [HttpPost("{assignmentId}/attachment")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UploadAssignmentAttachment(Guid assignmentId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");

        var teacherId = HttpContext.GetUserId();
        var result = await _assignmentAttachmentService.AddAttachmentAsync(teacherId, assignmentId, file);
        return Ok(result);
    }

    [HttpDelete("attachment/{attachmentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteAssignmentAttachment(Guid attachmentId)
    {
        var teacherId = HttpContext.GetUserId();
        var ok = await _assignmentAttachmentService.DeleteAttachmentAsync(teacherId, attachmentId);
        return ok ? NoContent() : BadRequest();
    }

    [HttpGet("{assignmentId}/homework-submission")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyHomeworkSubmission(Guid assignmentId)
    {
        var studentId = HttpContext.GetUserId();
        var result = await _homeworkSubmissionService.GetMySubmissionAsync(studentId, assignmentId);
        return Ok(result);
    }

    [HttpPut("{assignmentId}/homework-submission/comment")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> UpdateMyHomeworkComment(Guid assignmentId, [FromBody] UpdateHomeworkSubmissionCommentDTO dto)
    {
        var studentId = HttpContext.GetUserId();
        var result = await _homeworkSubmissionService.UpdateMyCommentAsync(studentId, assignmentId, dto);
        return Ok(result);
    }

    [HttpPost("{assignmentId}/homework-submission/attachment")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> UploadMyHomeworkAttachment(Guid assignmentId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is required.");

        var studentId = HttpContext.GetUserId();
        var result = await _homeworkSubmissionService.AddMyAttachmentAsync(studentId, assignmentId, file);
        return Ok(result);
    }

    [HttpDelete("homework-submission/attachment/{attachmentId}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> DeleteMyHomeworkAttachment(Guid attachmentId)
    {
        var studentId = HttpContext.GetUserId();
        var ok = await _homeworkSubmissionService.DeleteMyAttachmentAsync(studentId, attachmentId);
        return ok ? NoContent() : BadRequest();
    }

    [HttpGet("{assignmentId}/homework-grading/overview")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetHomeworkGradingOverview(Guid assignmentId)
    {
        var teacherId = HttpContext.GetUserId();
        var result = await _homeworkSubmissionService.GetHomeworkGradingOverviewAsync(teacherId, assignmentId);
        return Ok(result);
    }

    [HttpGet("{assignmentId}/homework-grading/student/{studentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GetHomeworkGradingDetail(Guid assignmentId, Guid studentId)
    {
        var teacherId = HttpContext.GetUserId();
        var result = await _homeworkSubmissionService.GetHomeworkGradingDetailAsync(teacherId, assignmentId, studentId);
        return Ok(result);
    }

    [HttpPut("{assignmentId}/homework-grading/student/{studentId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> GradeHomeworkSubmission(Guid assignmentId, Guid studentId, [FromBody] GradeHomeworkSubmissionDTO dto)
    {
        var teacherId = HttpContext.GetUserId();
        var result = await _homeworkSubmissionService.GradeHomeworkSubmissionAsync(teacherId, assignmentId, studentId, dto);
        return Ok(result);
    }
}