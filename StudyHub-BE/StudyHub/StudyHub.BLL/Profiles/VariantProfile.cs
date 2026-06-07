using AutoMapper;
using StudyHub.Common.DTO.TaskVariant;
using StudyHub.Entities;

namespace StudyHub.BLL.Profiles;

public class VariantProfile : Profile
{
    public VariantProfile()
    {
        CreateMap<TaskVariant, TaskVariantDTO>();
        CreateMap<CreateTaskVariantDTO, TaskVariant>()
            .ForMember(dest => dest.StudentAnswers, opt => opt.MapFrom(_ => new List<StudentAnswer>()));

        CreateMap<TaskVariant, TestTaskDTO>()
             .ForMember(dest => dest.QuestionType, opt => opt.Ignore());

        CreateMap<UpdateTaskVariantDTO, TaskVariant>();
    }
}
