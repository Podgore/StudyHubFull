using FluentValidation;
using StudyHub.Common.DTO.Lecture;
using StudyHub.Entities;

namespace StudyHub.Validators.LectureValidators;

public class LectureMaterialInputValidator : AbstractValidator<LectureMaterialInputDTO>
{
    public LectureMaterialInputValidator()
    {
        RuleFor(x => x.Title).NotEmpty();

        RuleFor(x => x.Type)
            .NotEqual(MaterialType.File)
            .WithMessage("File type must be uploaded as a file.");

        RuleFor(x => x.Content)
            .NotEmpty()
            .When(x => x.Type is MaterialType.Text or MaterialType.Code);

        RuleFor(x => x.ExternalUrl)
            .NotEmpty()
            .When(x => x.Type is MaterialType.Video or MaterialType.Link);
    }
}
