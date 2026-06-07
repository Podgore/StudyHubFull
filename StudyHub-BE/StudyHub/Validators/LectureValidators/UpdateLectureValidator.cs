using FluentValidation;
using StudyHub.Common.DTO.Lecture;

namespace StudyHub.Validators.LectureValidators;

public class UpdateLectureValidator : AbstractValidator<UpdateLectureDTO>
{
    public UpdateLectureValidator()
    {
        RuleFor(x => x.Title).NotEmpty();
    }
}
