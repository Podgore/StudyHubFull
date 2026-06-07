using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.UserInvitation;
using StudyHub.Common.Requests;

namespace StudyHub.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : Controller
{
    private readonly IUserInvitationService _userInvitingService;
    private readonly IUserService _userService;

    public UsersController(IUserInvitationService userInvitingService, IUserService userService)
    {
        _userInvitingService = userInvitingService;
        _userService = userService;
    }

    [HttpPost("invite")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> InviteUsers(InviteUsersRequest dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _userInvitingService.InviteManyAsync(userId, dto);
        return result.Success != null ? Ok(result) : BadRequest("An error occurred while inviting students.");
    }

    [HttpGet("[action]")]
    public async Task<IActionResult> SearchStudent([FromQuery] SearchRequest request)
    {
        var result = await _userService.GetStudentsAsync(request);
        return Ok(result);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateUser(UpdateUserDTO dto)
    {
        var userId = HttpContext.GetUserId();
        var result = await _userService.UpdateUserAsync(userId, dto);
        return Ok(result);
    }

    [HttpPost("me/avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile avatar)
    {
        var userId = HttpContext.GetUserId();
        var result = await _userService.UploadAvatarAsync(userId, avatar);
        return Ok(result);
    }

    [HttpDelete("me/avatar")]
    public IActionResult DeleteAvatar()
    {
        var userId = HttpContext.GetUserId();
        var result = _userService.DeleteAvatar(userId);
        return result ? NoContent() : NotFound();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetUser()
    {
        var userId = HttpContext.GetUserId();
        var result = await _userService.GetUserAsync(userId);
        return Ok(result);
    }
}