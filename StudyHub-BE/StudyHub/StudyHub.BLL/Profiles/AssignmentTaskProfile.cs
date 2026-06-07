using AutoMapper;
using StudyHub.Common.DTO.AssignmentTaskDTO;
using StudyHub.Entities;

namespace StudyHub.BLL.Profiles;

public class AssignmentTaskProfile : Profile
{
    public AssignmentTaskProfile()
    {
        CreateMap<AssignmentTask, AssignmentTaskDTO>();
        CreateMap<CreateAssignmentTaskDTO, AssignmentTask>();
        CreateMap<UpdateAssignmentTaskDTO, AssignmentTask>();
    }
}