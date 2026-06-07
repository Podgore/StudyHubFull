using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.TaskVariant;

namespace StudyHub.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class VariantController : Controller
{
    private readonly IVariantService _variantService;

    public VariantController(IVariantService variantService)
    {
        _variantService = variantService;
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> InsertVariant(Guid assignmentTaskId, CreateTaskVariantDTO taskVariant)
    {
        var result = await _variantService.CreateTaskVariantAsync(assignmentTaskId, taskVariant);
        return Ok(result);
    }

    [HttpGet("{assignmentTaskId}")]
    [Authorize]
    public async Task<IActionResult> GetVariant(Guid assignmentTaskId)
    {
        var result = await _variantService.GetTaskVariantAsync(assignmentTaskId);
        return Ok(result);
    }

    [HttpPut("{taskVariantId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateVariant(Guid taskVariantId, UpdateTaskVariantDTO taskVariant)
    {
        var result = await _variantService.UpdateTaskVariantAsync(taskVariantId, taskVariant);
        return Ok(result);
    }

    [HttpDelete("{taskVariantId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteVariant(Guid taskVariantId)
    {
        return await _variantService.DeleteTaskVariantAsync(taskVariantId) ? NoContent() : NotFound();
    }

    [HttpGet("[action]")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetTestForStudent(Guid assignmentId)
    {
        var userId = HttpContext.GetUserId();
        var result = await _variantService.GetAssignmentTaskForStudentAsync(assignmentId, userId);
        return Ok(result);
    }
}
