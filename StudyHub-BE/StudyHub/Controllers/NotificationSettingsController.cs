using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealtorAPI.Extensions;
using StudyHub.BLL.Services.Interfaces;
using StudyHub.Common.DTO.Notifications;
using StudyHub.Hangfire.Abstractions;
using StudyHub.Hangfire.Jobs;

namespace StudyHub.Controllers;

[ApiController]
[Authorize]
[Route("api/notification-settings")]
public class NotificationSettingsController : ControllerBase
{
    private readonly INotificationSettingsService _notificationSettings;

    public NotificationSettingsController(INotificationSettingsService notificationSettings)
    {
        _notificationSettings = notificationSettings;
    }

    [HttpGet]
    public async Task<ActionResult<NotificationSettingsResponseDto>> Get()
    {
        var userId = HttpContext.GetUserId();
        return Ok(await _notificationSettings.GetAsync(userId));
    }

    [HttpPut]
    public async Task<ActionResult<NotificationSettingsResponseDto>> Put([FromBody] UpdateNotificationSettingsRequestDto dto)
    {
        var userId = HttpContext.GetUserId();
        return Ok(await _notificationSettings.UpdateAsync(userId, dto));
    }

    [HttpPost("telegram/link")]
    public async Task<ActionResult<TelegramLinkResponseDto>> CreateTelegramLink()
    {
        var userId = HttpContext.GetUserId();
        return Ok(await _notificationSettings.CreateTelegramLinkAsync(userId));
    }

    [HttpDelete("telegram")]
    public async Task<IActionResult> DisconnectTelegram()
    {
        var userId = HttpContext.GetUserId();
        await _notificationSettings.DisconnectTelegramAsync(userId);
        return NoContent();
    }

    [HttpPost("telegram/test")]
    public async Task<IActionResult> TestTelegram()
    {
        var userId = HttpContext.GetUserId();
        await _notificationSettings.SendTestNotificationAsync(userId);
        return NoContent();
    }

    /// <summary>Enqueues the Hangfire daily digest job (all users with digest preferences).</summary>
    [HttpPost("digest/trigger")]
    [Authorize(Roles = "Teacher,Admin")]
    public IActionResult TriggerDailyDigest([FromServices] IHangfireService hangfire)
    {
        var jobId = hangfire.Enqueue<TelegramDailyDigestJob>();
        return Accepted(new { jobId, message = "Daily digest job enqueued." });
    }
}
