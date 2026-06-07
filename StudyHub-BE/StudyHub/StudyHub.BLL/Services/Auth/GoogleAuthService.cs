using AutoMapper;
using Google.Apis.Auth;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using StudyHub.BLL.Services.Interfaces.Auth;
using StudyHub.Common.Configs;
using StudyHub.Common.DTO.AuthDTO;
using StudyHub.Common.Exceptions;
using StudyHub.DAL.Repositories.Interfaces;
using StudyHub.Entities;
using System.Web;

namespace StudyHub.BLL.Services.Auth;

public class GoogleAuthService : AuthService, IGoogleAuthService
{
    private readonly GoogleAuthConfig _googleConfig;

    public GoogleAuthService(
        IRepository<InvitedUser> invitedUserRepository,
        IRepository<RefreshToken> refreshTokenRepository,
        UserManager<User> userManager,
        ITokenService tokenService,
        IEncryptService encryptService,
        IOptions<GoogleAuthConfig> googleConfig,
        IMapper mapper)
            : base(userManager, tokenService, encryptService, invitedUserRepository, refreshTokenRepository, mapper)
    {
        _googleConfig = googleConfig.Value;
    }

    public async Task<AuthSuccessDTO> GoogleRegisterAsync(string authorizationCode, string token)
    {
        var payload = await GetGooglePayloadAsync(authorizationCode);

        var invitedUser = _invitedUserRepository.FirstOrDefault(e => e.Email == payload.Email)
            ?? throw new NotFoundException($"User with this email wasn't invited: {payload.Email}");

        if (!_encryptService.Verify(HttpUtility.UrlDecode(token), invitedUser.Token))
            throw new InvalidTokenException($"This token isn't correct: {token}");

        var user = await _userManager.FindByEmailAsync(payload.Email);

        if (user != null)
            throw new NotFoundException("User with this email already exists");

        user = _mapper.Map<User>(payload);

        var createdUserResult = await _userManager.CreateAsync(user);

        if (!createdUserResult.Succeeded)
            throw new UserManagerException("Unable to authenticate given user", createdUserResult.Errors);

        var roleResult = await _userManager.AddToRoleAsync(user, invitedUser.Role);

        if (!roleResult.Succeeded)
            throw new UserManagerException($"User manager operation failed:\n", roleResult.Errors);
            
        await _invitedUserRepository.DeleteAsync(invitedUser);

        return await GetAuthTokensAsync(user);
    }

    public async Task<AuthSuccessDTO> GoogleLoginAsync(string authorizationCode)
    {
        var paylod = await GetGooglePayloadAsync(authorizationCode);

        var user = await _userManager.FindByEmailAsync(paylod.Email)
            ?? throw new NotFoundException($"Unable to find user by specified email. Email: {paylod.Email}");

        return await GetAuthTokensAsync(user);
    }

    private async Task<GoogleJsonWebSignature.Payload> GetGooglePayloadAsync(string authorizationCode)
    {
        if (string.IsNullOrWhiteSpace(_googleConfig.ClientId) || string.IsNullOrWhiteSpace(_googleConfig.ClientSecret))
            throw new IncorrectParametersException("Google OAuth is not configured on the server.");

        try
        {
            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _googleConfig.ClientId,
                    ClientSecret = _googleConfig.ClientSecret.Trim(),
                },
            });

            var tokenResponse = await flow.ExchangeCodeForTokenAsync(
                string.Empty,
                authorizationCode,
                _googleConfig.RedirectUri,
                CancellationToken.None);

            var setting = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { _googleConfig.ClientId },
                IssuedAtClockTolerance = _googleConfig.IssuedAtClockTolerance,
                ExpirationTimeClockTolerance = _googleConfig.ExpirationTimeClockTolerance,
            };

            return await GoogleJsonWebSignature.ValidateAsync(tokenResponse.IdToken, setting);
        }
        catch (TokenResponseException ex)
        {
            throw new IncorrectParametersException(
                $"Google sign-in failed ({ex.Error?.Error ?? "token_exchange"}). " +
                "Check ClientId, ClientSecret, and RedirectUri (use postmessage for popup auth-code flow). " +
                ex.Error?.ErrorDescription);
        }
    }
}