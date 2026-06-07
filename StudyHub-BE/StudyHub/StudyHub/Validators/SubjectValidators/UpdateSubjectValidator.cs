using FluentValidation;
using StudyHub.Common.DTO.Subject;

namespace StudyHub.Validators.SubjectValidators;

public class UpdateSubjectValidator : AbstractValidator<UpdateSubjectDTO>
{
    public UpdateSubjectValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty();
    }
}