using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces.Assignment;
using StudyHub.Common.DTO.AssignmentTaskOption;

namespace StudyHub.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class OptionController : Controller
{
    private readonly IOptionsService _optionService;

    public OptionController(IOptionsService optionService)
    {
        _optionService = optionService;
    }

    [HttpPost("taskVariantId")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> InsertOption(Guid taskVariantId, List<CreateTaskOptionDTO> taskOptions)
    {
        var result = await _optionService.AddTaskOptionsAsync(taskVariantId, taskOptions);
        return Ok(result);
    }

    [HttpPut("optionId")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateOption(Guid optionId, UpdateTaskOptionDTO taskOptions)
    {
        var result = await _optionService.UpdateTaskOptionsAsync(optionId, taskOptions);
        return Ok(result);
    }

    [HttpDelete("optionId")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteVariant(Guid optionId)
    {
        return await _optionService.DeleteTaskOptionsAsync(optionId) ? NoContent() : NotFound();
    }
}
