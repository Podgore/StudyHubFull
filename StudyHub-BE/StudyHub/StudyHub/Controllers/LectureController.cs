using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.Lecture;

namespace StudyHub.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class LectureController : Controller
{
    private readonly ILectureService _lectureService;

    public LectureController(ILectureService lectureService)
    {
        _lectureService = lectureService;
    }

    [HttpGet("{lectureId}")]
    public async Task<IActionResult> GetLecture(Guid lectureId)
    {
        var userId = HttpContext.GetUserId();
        var result = await _lectureService.GetLectureByIdForUserAsync(userId, lectureId);
        return Ok(result);
    }

    [HttpPut("{lectureId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateLecture(Guid lectureId, UpdateLectureDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _lectureService.UpdateLectureAsync(userId, lectureId, dto);
        return Ok(result);
    }

    [HttpDelete("{lectureId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteLecture(Guid lectureId)
    {
        var userId = HttpContext.GetUserId();
        return await _lectureService.DeleteLectureAsync(userId, lectureId) ? NoContent() : NotFound();
    }
}
