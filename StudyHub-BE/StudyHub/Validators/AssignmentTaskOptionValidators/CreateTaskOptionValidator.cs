using FluentValidation;
using StudyHub.Common.DTO.AssignmentTaskOption;

namespace StudyHub.Validators.AssignmentTaskOptionValidators;

public class CreateTaskOptionValidator : AbstractValidator<List<CreateTaskOptionDTO>>
{
    public CreateTaskOptionValidator()
    {
        RuleFor(options => options)
            .Must(HaveConsistentCorrectness)
            .When(options => options.Count > 0)
            .WithMessage("Options must all have IsCorrect set or unset, but not a mix.");
    }

    private bool HaveConsistentCorrectness(List<CreateTaskOptionDTO> options)
    {
        bool IsNotNull = options.All(option => option.IsCorrect != null);
        bool IsNull = options.All(option => option.IsCorrect == null);

        return IsNotNull || IsNull;
    }
}