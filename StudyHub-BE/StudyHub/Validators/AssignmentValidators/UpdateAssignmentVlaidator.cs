using FluentValidation;
using StudyHub.Common.DTO.Assignment;

namespace StudyHub.Validators.AssignmentValidators;

public class UpdateAssignmentVlaidator : AbstractValidator<UpdateAssignmentDTO>
{
    public UpdateAssignmentVlaidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty();

        RuleFor(x => x.MaxMark)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.OpeningDate)
            .NotEmpty().WithMessage("OpeningDate is required.")
            .GreaterThan(DateTime.Now).WithMessage($"OpeningDate must be greater than {DateTime.Now}");

        RuleFor(x => x.ClosingDate)
            .NotEmpty().WithMessage("ClosingDate is required.")
            .GreaterThan(DateTime.Now).WithMessage($"ClosingDate must be greater than {DateTime.Now}")
            .GreaterThan(x => x.OpeningDate).WithMessage($"ClosingDate must be greater than OpeningDate");

        RuleFor(x => x.Duration)
            .GreaterThanOrEqualTo(TimeSpan.Zero)
            .LessThanOrEqualTo(x => x.ClosingDate - x.OpeningDate)
            .WithMessage("Duration has to be within the assignment window");
    }
}