using FluentValidation;
using StudyHub.Common.DTO.Subject;

namespace StudyHub.Validators.SubjectValidators;

public class CreateSubjectValidator : AbstractValidator<CreateSubjectDTO>
{
    public CreateSubjectValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty();
    }
}