using FluentValidation;
using StudyHub.Common.DTO.Lecture;

namespace StudyHub.Validators.LectureValidators;

public class CreateLectureValidator : AbstractValidator<CreateLectureDTO>
{
    public CreateLectureValidator()
    {
        RuleFor(x => x.Title).NotEmpty();
        RuleForEach(x => x.Materials).SetValidator(new LectureMaterialInputValidator());
    }
}
