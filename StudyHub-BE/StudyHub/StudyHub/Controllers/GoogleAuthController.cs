using Microsoft.AspNetCore.Mvc;
using StudyHub.BLL.Services.Interfaces.Auth;

namespace StudyHub.Controllers;

[Route("api/google-auth")]
[ApiController]
public class GoogleAuthController : Controller
{
    private readonly IGoogleAuthService _googleAuthService;

    public GoogleAuthController(IGoogleAuthService googleAuthService)
    {
        _googleAuthService = googleAuthService;
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> GoogleRegister([FromHeader(Name = "Authorization-Code")] string authorizationCode,[FromQuery] string token)
    {
        var result = await _googleAuthService.GoogleRegisterAsync(authorizationCode, token);
        return Ok(result);
    }

    [HttpPost("[action]")]
    public async Task<IActionResult> GoogleLogin([FromHeader(Name = "Authorization-Code")] string authorizationCode)
    {
        var result = await _googleAuthService.GoogleLoginAsync(authorizationCode);
        return Ok(result);
    }
}