using FluentValidation;
using StudyHub.Common.Requests;

namespace StudyHub.Validators.AuthorizationValidators;

public class ForgotPasswordValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Your email is invalid");
    }
}
