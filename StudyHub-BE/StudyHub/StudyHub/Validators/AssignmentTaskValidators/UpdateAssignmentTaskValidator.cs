using FluentValidation;
using StudyHub.Common.DTO.AssignmentTaskDTO;

namespace StudyHub.Validators.AssignmentTaskValidators;

public class UpdateAssignmentTaskValidator : AbstractValidator<UpdateAssignmentTaskDTO>
{
    public UpdateAssignmentTaskValidator()
    {
        RuleFor(x => x.MaxMark)
            .GreaterThan(0);

        RuleForEach(x => x.TaskVariants)
            .SetValidator(new UpdateTaskVariantValidator());
    }
}
