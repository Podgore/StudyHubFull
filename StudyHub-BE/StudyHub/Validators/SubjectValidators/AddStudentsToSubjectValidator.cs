using FluentValidation;
using StudyHub.Common.Requests;

namespace StudyHub.Validators.SubjectValidators;

public class AddStudentsToSubjectValidator : AbstractValidator<StudentsToSubjectRequest>
{
    public AddStudentsToSubjectValidator()
    {
        RuleFor(x => x.Emails)
            .NotEmpty()
            .ForEach(email => email.EmailAddress().WithMessage("Some of those emails is invalid"));
    }
}
