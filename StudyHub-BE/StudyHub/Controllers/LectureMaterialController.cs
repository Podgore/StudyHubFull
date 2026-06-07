using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.Lecture;

namespace StudyHub.Controllers;

[Route("api/lecture")]
[ApiController]
[Authorize]
public class LectureMaterialController : Controller
{
    private readonly ILectureMaterialService _lectureMaterialService;

    public LectureMaterialController(ILectureMaterialService lectureMaterialService)
    {
        _lectureMaterialService = lectureMaterialService;
    }

    [HttpPost("{lectureId}/materials/file")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AddFileMaterial(Guid lectureId, [FromForm] AddLectureFileMaterialRequest request)
    {
        var userId = HttpContext.GetUserId();
        var result = await _lectureMaterialService.AddFileMaterialAsync(userId, lectureId, request);
        return Ok(result);
    }

    [HttpPost("{lectureId}/materials/video")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AddUploadedVideoMaterial(Guid lectureId, [FromForm] AddLectureVideoMaterialRequest request)
    {
        var userId = HttpContext.GetUserId();
        var result = await _lectureMaterialService.AddUploadedVideoMaterialAsync(userId, lectureId, request);
        return Ok(result);
    }

    [HttpPost("{lectureId}/materials")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> AddMaterial(Guid lectureId, LectureMaterialInputDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _lectureMaterialService.AddMaterialAsync(userId, lectureId, dto);
        return Ok(result);
    }

    [HttpDelete("materials/{materialId}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteMaterial(Guid materialId)
    {
        var userId = HttpContext.GetUserId();
        return await _lectureMaterialService.DeleteMaterialAsync(userId, materialId) ? NoContent() : NotFound();
    }
}
