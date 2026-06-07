using FluentValidation;
using StudyHub.Common.DTO.Lecture;

namespace StudyHub.Validators.LectureValidators;

public class AddLectureFileMaterialRequestValidator : AbstractValidator<AddLectureFileMaterialRequest>
{
    public AddLectureFileMaterialRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty();
        RuleFor(x => x.File).NotNull();
    }
}
