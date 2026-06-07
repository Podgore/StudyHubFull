using FluentValidation;
using StudyHub.Common.DTO.AssignmentTaskDTO;

namespace StudyHub.Validators.AssignmentTaskValidators;

public class CreateAssignmentTaskValidator : AbstractValidator<CreateAssignmentTaskDTO>
{
    public CreateAssignmentTaskValidator()
    {
        RuleFor(x => x.MaxMark)
            .GreaterThan(0);

        RuleForEach(x => x.TaskVariants)
            .SetValidator(new CreateTaskVariantValidator());
    }
}
