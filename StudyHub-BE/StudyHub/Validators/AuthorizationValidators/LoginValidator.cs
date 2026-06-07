using FluentValidation;
using StudyHub.Common.DTO.AuthDTO;
using StudyHub.Common.Utility;

namespace StudyHub.Validators.AuthorizationValidators;

public class LoginValidator : AbstractValidator<LoginUserDTO>
{
    public LoginValidator()
    {
        RuleFor(dto => dto.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Your email is invalid");

        RuleFor(dto => dto.Password)
            .NotEmpty()
            .Matches(ValidationRegexes.PasswordRegex)
            .WithMessage("Your password must be 8 minimum length and must contain at least one uppercase and lowercase letter, one number and one special symbol");
    }
}
