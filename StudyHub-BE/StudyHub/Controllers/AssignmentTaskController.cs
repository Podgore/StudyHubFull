using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.AssignmentTaskDTO;
using StudyHub.Entities;
using StudyHub.Validators.AssignmentTaskValidators;

namespace StudyHub.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AssignmentTaskController : Controller
{
    private readonly IAssignmentTaskService _assignmentTaskService;
    private readonly UpdateTaskVariantValidator _updateAssignmentTaskValidator;

    public AssignmentTaskController(
        IAssignmentTaskService serviceTask,
        UpdateTaskVariantValidator updateAssignmentValidator)
    {
        _assignmentTaskService = serviceTask;
        _updateAssignmentTaskValidator = updateAssignmentValidator;
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> InsertAssigmentTask(CreateAssignmentTaskDTO dto)
    {
        var result = await _assignmentTaskService.AddAssignmentTaskAsync(dto);
        return Ok(result);
    }

    [HttpGet("{assignmentId}")]
    public async Task<IActionResult> GetAll(Guid assignmentId)
    {
        var result = await _assignmentTaskService.GetAssignmentTaskAsync(assignmentId);
        return Ok(result);
    }

    [HttpPut("{assignmentTaskId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateAssigmentTask(Guid assignmentTaskId, [FromBody] UpdateAssignmentTaskDTO dto)
    {
        var result = await _assignmentTaskService.UpdateAssignmentTaskAsync(assignmentTaskId, dto);
        return Ok(result);
    }

    [HttpDelete("{assignmentTaskId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteAssignmentTask(Guid assignmentTaskId)
    {
        return await _assignmentTaskService.DeleteAssignmentTaskAsync(assignmentTaskId) ? NoContent() : NotFound();
    }
}