using FluentValidation;
using StudyHub.Common.Requests;
using StudyHub.Common.Utility;

namespace StudyHub.Validators.AuthorizationValidators;

public class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Your email is invalid");

        RuleFor(request => request.NewPassword)
            .NotEmpty()
            .Matches(ValidationRegexes.PasswordRegex)
            .WithMessage("Your password must be 8 minimum length and must contain at least one uppercase and lowercase letter, one number and one special symbol");

        RuleFor(request => request.ConfimPassword)
            .NotEmpty()
            .Equal(request => request.NewPassword)
            .WithMessage("Passwords are not equal");

        RuleFor(request => request.ResetToken)
            .NotEmpty();
    }
}
