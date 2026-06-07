using FluentValidation;
using StudyHub.Common.Requests;

namespace StudyHub.Validators.AuthorizationValidators;

public class InviteUserValidator : AbstractValidator<InviteUsersRequest>
{
    public InviteUserValidator()
    {
        RuleFor(request => request.Emails)
            .NotEmpty()
            .ForEach(email => email.EmailAddress().WithMessage("Some of those emails is invalid"));
    }
}
