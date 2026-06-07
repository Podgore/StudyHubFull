using FluentValidation;
using StudyHub.Common.DTO.UserInvitation;
using StudyHub.Common.Utility;

namespace StudyHub.Validators.UserValidator;

public class UpdateUserValidator : AbstractValidator<UpdateUserDTO>
{
    public UpdateUserValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .Matches(ValidationRegexes.FullNameRegex)
            .WithMessage("{PropertyName} should only contain letters.");
        RuleFor(x => x.Telegram)
            .NotEmpty()
            .Matches(ValidationRegexes.Telegram)
            .WithMessage("Invalid {PropertyName}.");
    }
}
