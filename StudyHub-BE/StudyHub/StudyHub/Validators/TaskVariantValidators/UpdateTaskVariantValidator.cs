using FluentValidation;
using StudyHub.Common.DTO.TaskVariant;
using StudyHub.Validators.AssignmentTaskOptionValidators;

namespace StudyHub.Validators.AssignmentTaskValidators;

public class UpdateTaskVariantValidator : AbstractValidator<UpdateTaskVariantDTO>
{
    public UpdateTaskVariantValidator()
    {
        RuleFor(x => x.Label)
            .NotNull();

        RuleFor(x => x.TaskOption)
            .SetValidator(new UpdateTaskOptionValidator());
    }
}