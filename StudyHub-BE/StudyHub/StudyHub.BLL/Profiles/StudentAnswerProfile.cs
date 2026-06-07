using AutoMapper;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Common.DTO.User.Student;
using StudyHub.Entities;

namespace StudyHub.BLL.Profiles;

public class StudentAnswerProfile : Profile
{
    public StudentAnswerProfile()
    {
        CreateMap<AnswerVariantDTO, StudentAnswer>()
            .ForMember(dest => dest.StudentId, opt => opt.Ignore())
            .ForMember(dest => dest.Id, opt => opt.Ignore());

        CreateMap<StudentAnswer, OpenEndedSubmissionDTO>()
            .ForMember(dest => dest.StudentAnswerId, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.StudentFullName, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : string.Empty))
            .ForMember(dest => dest.StudentEmail, opt => opt.MapFrom(src => src.User != null ? src.User.Email ?? string.Empty : string.Empty))
            .ForMember(dest => dest.TaskVariantId, opt => opt.MapFrom(src => src.TaskVariant!.Id))
            .ForMember(dest => dest.AssignmentTaskId, opt => opt.MapFrom(src => src.TaskVariant!.AssignmentTaskId))
            .ForMember(dest => dest.QuestionLabel, opt => opt.MapFrom(src => src.TaskVariant!.Label))
            .ForMember(dest => dest.StudentResponse, opt => opt.MapFrom(src => src.Answer))
            .ForMember(dest => dest.ReferenceHint, opt => opt.MapFrom(src => ReferenceHintFromVariant(src.TaskVariant!)))
            .ForMember(dest => dest.MaxMark, opt => opt.MapFrom(src => src.TaskVariant!.AssignmentTask.MaxMark))
            .ForMember(dest => dest.AwardedMark, opt => opt.MapFrom(src => src.Mark))
            .ForMember(dest => dest.ReviewedByTeacher, opt => opt.MapFrom(src => src.OpenEndedTeacherReviewed))
            .ForMember(dest => dest.TeacherFeedback, opt => opt.MapFrom(src => src.OpenEndedTeacherFeedback));
    }

    private static string? ReferenceHintFromVariant(TaskVariant variant)
    {
        var labels = variant.TaskOption
            .Select(o => o.Label)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Select(l => l!.Trim())
            .Distinct()
            .ToList();

        return labels.Count == 0 ? null : string.Join("\n", labels);
    }
}
