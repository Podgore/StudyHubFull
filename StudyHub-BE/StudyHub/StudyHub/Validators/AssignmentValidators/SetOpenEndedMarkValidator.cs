using FluentValidation;
using StudyHub.Common.DTO.Assignment;

namespace StudyHub.Validators.AssignmentValidators;

public class SetOpenEndedMarkValidator : AbstractValidator<SetOpenEndedMarkDTO>
{
    public SetOpenEndedMarkValidator()
    {
        RuleFor(x => x.StudentAnswerId).NotEmpty();
        RuleFor(x => x.Mark).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Feedback).MaximumLength(4000).When(x => x.Feedback != null);
    }
}
