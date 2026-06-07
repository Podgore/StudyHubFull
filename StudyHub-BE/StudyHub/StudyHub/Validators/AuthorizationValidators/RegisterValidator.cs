using FluentValidation;
using StudyHub.Common.DTO.AuthDTO;
using StudyHub.Common.Utility;

namespace StudyHub.Validators.AuthorizationValidators;

public class RegisterValidator : AbstractValidator<RegisterUserDTO>
{
    public RegisterValidator()
    {
        RuleFor(dto => dto.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Your email is invalid");

        RuleFor(dto => dto.FullName)
            .NotEmpty()
            .Matches(ValidationRegexes.FullNameRegex)
            .WithMessage("'{PropertyName}' should only contain letters.");

        RuleFor(dto => dto.Password)
           .NotEmpty()
           .Matches(ValidationRegexes.PasswordRegex)
           .WithMessage("Your password must be 8 minimum length and must contain at least one uppercase and lowercase letter, one number and one special symbol");

        RuleFor(dto => dto.Token)
            .NotEmpty();
    }
}
