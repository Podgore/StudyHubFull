using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces;

namespace StudyHub.Controllers;

[Route("api/student-grades")]
[ApiController]
[Authorize(Roles = "Student")]
public class StudentGradesController : ControllerBase
{
    private readonly IStudentGradesService _studentGradesService;

    public StudentGradesController(IStudentGradesService studentGradesService)
    {
        _studentGradesService = studentGradesService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var studentId = HttpContext.GetUserId();
        var result = await _studentGradesService.GetSummaryAsync(studentId);
        return Ok(result);
    }

    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects()
    {
        var studentId = HttpContext.GetUserId();
        var result = await _studentGradesService.GetSubjectRowsAsync(studentId);
        return Ok(result);
    }

    [HttpGet("subjects/{subjectId:guid}/assignments")]
    public async Task<IActionResult> GetAssignmentsForSubject(Guid subjectId)
    {
        var studentId = HttpContext.GetUserId();
        var result = await _studentGradesService.GetAssignmentsForSubjectAsync(studentId, subjectId);
        return Ok(result);
    }
}
