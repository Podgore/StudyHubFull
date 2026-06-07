using FluentValidation;
using StudyHub.Common.DTO.TaskVariant;
using StudyHub.Validators.AssignmentTaskOptionValidators;

namespace StudyHub.Validators.AssignmentTaskValidators;

public class CreateTaskVariantValidator : AbstractValidator<CreateTaskVariantDTO>
{
    public CreateTaskVariantValidator()
    {
        RuleFor(x => x.Label)
            .NotNull();

        RuleFor(x => x.TaskOption)
            .SetValidator(new CreateTaskOptionValidator());
    }
}