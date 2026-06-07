using FluentValidation;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Entities;

namespace StudyHub.Validators.AssignmentValidators;

public class CreateAssignmentValidator : AbstractValidator<CreateAssignmentDTO>
{
    public CreateAssignmentValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty();

        RuleFor(x => x.OpeningDate)
            .NotEmpty().WithMessage("OpeningDate is required.")
            .GreaterThan(DateTime.Now).WithMessage("OpeningDate must be greater than now");

        RuleFor(x => x.ClosingDate)
            .NotEmpty().WithMessage("ClosingDate is required.")
            .GreaterThan(DateTime.Now).WithMessage("ClosingDate must be greater than now")
            .GreaterThan(x => x.OpeningDate).WithMessage("ClosingDate must be greater than OpeningDate");

        When(x => x.Kind == AssignmentKind.TimedTest, () =>
        {
            RuleFor(x => x.MaxMark)
                .GreaterThan(0);

            RuleFor(x => x.Duration)
                .NotEmpty().WithMessage("Duration is required for timed tests.")
                .LessThanOrEqualTo(x => x.ClosingDate - x.OpeningDate)
                .WithMessage("Duration has to be less or equal to the assignment window");
        });

        When(x => x.Kind == AssignmentKind.Homework, () =>
        {
            RuleFor(x => x.MaxMark)
                .GreaterThanOrEqualTo(0);

            RuleFor(x => x.Duration)
                .GreaterThanOrEqualTo(TimeSpan.Zero)
                .LessThanOrEqualTo(x => x.ClosingDate - x.OpeningDate)
                .WithMessage("Duration has to be within the assignment window (use zero for non-timed tasks)");
        });
    }
}