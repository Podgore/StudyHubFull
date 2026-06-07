using AutoMapper;
using StudyHub.Common.DTO.StudentGrades;
using StudyHub.Entities;

namespace StudyHub.BLL.Profiles;

public class StudentGradesProfile : Profile
{
    public StudentGradesProfile()
    {
        CreateMap<Assignment, StudentAssignmentGradeRowDTO>()
            .ForMember(d => d.AssignmentId, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.Title, o => o.MapFrom(s => s.Title))
            .ForMember(d => d.Kind, o => o.MapFrom(s => s.Kind))
            .ForMember(d => d.TypeLabel, o => o.MapFrom(s => s.Kind == AssignmentKind.Homework ? "Homework" : "Test"))
            .ForMember(d => d.DueAt, o => o.MapFrom(s => s.ClosingDate))
            .ForMember(d => d.MaxPoints, o => o.MapFrom(s => s.MaxMark))
            .ForMember(d => d.SubmittedAt, o => o.Ignore())
            .ForMember(d => d.ScorePercent, o => o.Ignore())
            .ForMember(d => d.PointsEarned, o => o.Ignore())
            .ForMember(d => d.TeacherFeedback, o => o.Ignore());
    }
}
