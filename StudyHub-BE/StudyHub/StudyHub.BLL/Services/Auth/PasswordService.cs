using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using StudyHub.BLL.Services.Interfaces.Auth;
using StudyHub.Common.Configs;
using StudyHub.Common.Exceptions;
using StudyHub.Common.Requests;
using StudyHub.Entities;
using StudyHub.FluentEmail.MessageBase;
using StudyHub.FluentEmail.Services.Interfaces;
using System.Web;

namespace StudyHub.BLL.Services.Auth;

public class PasswordService : IPasswordService
{
    private readonly UserManager<User> _userManager;
    private readonly CallbackUrisConfig _callbackUrisConfig;
    private readonly IEmailService _emailService;

    public PasswordService(
        UserManager<User> userManager,
        IOptions<CallbackUrisConfig> callbackUrisConfig,
        IEmailService emailService)
    {
        _userManager = userManager;
        _callbackUrisConfig = callbackUrisConfig.Value;
        _emailService = emailService;
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new NotFoundException($"User with this email does not exist. Email: {request.Email}");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        var uri = string.Format(_callbackUrisConfig.ResetPasswordUri, user.Email, HttpUtility.UrlEncode(token));

        var emailSent = await _emailService.SendAsync(request.Email,
            new ResetPasswordMessage { Recipient = request.Email, ResetPasswordUri = uri });

        return emailSent;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new NotFoundException($"Unable to find user by specified email. Email: {request.Email}");

        var isSamePassword = await _userManager.CheckPasswordAsync(user, request.NewPassword);

        if (isSamePassword)
            throw new IncorrectParametersException("New password have to differ from the old one");

        var decodedToken = HttpUtility.UrlDecode(request.ResetToken);

        var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);

        if (!result.Succeeded)
            throw new UserManagerException("Unable to reset password", result.Errors);

        return result.Succeeded;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException($"Unable to find user by id. Id: {userId}");

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.OldPassword);

        if (!isPasswordValid)
            throw new InvalidCredentialsException("Old password is incorrect");

        var result = await _userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);

        if (!result.Succeeded)
            throw new UserManagerException("Unable to change password", result.Errors);

        return result.Succeeded;
    }
}