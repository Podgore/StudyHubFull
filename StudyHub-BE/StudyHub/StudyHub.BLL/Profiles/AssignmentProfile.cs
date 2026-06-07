using AutoMapper;
using StudyHub.Common.DTO.Assignment;
using StudyHub.Entities;

namespace StudyHub.BLL.Profiles;

public class AssignmentProfile : Profile
{
    public AssignmentProfile()
    {
        CreateMap<HomeworkSubmission, HomeworkSubmissionDTO>()
            .ForMember(d => d.CanEdit, o => o.Ignore())
            .ForMember(d => d.Attachments, o => o.MapFrom((s, _, _, ctx) =>
                ctx.Mapper.Map<List<AssignmentAttachmentDTO>>(s.Attachments ?? new List<HomeworkSubmissionAttachment>())));

        CreateMap<User, HomeworkGradingStudentRowDTO>()
            .ForMember(d => d.StudentId, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.Email, o => o.MapFrom(s => s.Email ?? string.Empty))
            .ForMember(d => d.Status, o => o.Ignore())
            .ForMember(d => d.Score, o => o.Ignore());

        CreateMap<Assignment, HomeworkGradingOverviewDTO>()
            .ForMember(d => d.AssignmentTitle, o => o.MapFrom(s => s.Title))
            .ForMember(d => d.GradedCount, o => o.Ignore())
            .ForMember(d => d.PendingCount, o => o.Ignore())
            .ForMember(d => d.NotSubmittedCount, o => o.Ignore())
            .ForMember(d => d.Students, o => o.Ignore());

        CreateMap<User, HomeworkGradingDetailDTO>()
            .ForMember(d => d.StudentId, o => o.MapFrom(s => s.Id))
            .ForMember(d => d.Email, o => o.MapFrom(s => s.Email ?? string.Empty))
            .ForMember(d => d.StudentComment, o => o.Ignore())
            .ForMember(d => d.UpdatedAt, o => o.Ignore())
            .ForMember(d => d.Attachments, o => o.MapFrom(_ => new List<AssignmentAttachmentDTO>()))
            .ForMember(d => d.TeacherScore, o => o.Ignore())
            .ForMember(d => d.TeacherFeedback, o => o.Ignore())
            .ForMember(d => d.MaxMark, o => o.Ignore())
            .ForMember(d => d.Status, o => o.Ignore());

        CreateMap<HomeworkSubmission, HomeworkGradingDetailDTO>()
            .ForMember(d => d.StudentId, o => o.Ignore())
            .ForMember(d => d.FullName, o => o.Ignore())
            .ForMember(d => d.Email, o => o.Ignore())
            .ForMember(d => d.StudentComment, o => o.MapFrom(s => s.StudentComment))
            .ForMember(d => d.UpdatedAt, o => o.MapFrom(s => (DateTime?)s.UpdatedAt))
            .ForMember(d => d.Attachments, o => o.MapFrom((s, _, _, ctx) =>
                ctx.Mapper.Map<List<AssignmentAttachmentDTO>>(s.Attachments ?? new List<HomeworkSubmissionAttachment>())))
            .ForMember(d => d.TeacherScore, o => o.MapFrom(s => s.TeacherScore))
            .ForMember(d => d.TeacherFeedback, o => o.MapFrom(s => s.TeacherFeedback))
            .ForMember(d => d.MaxMark, o => o.Ignore())
            .ForMember(d => d.Status, o => o.Ignore());

        CreateMap<AssignmentAttachment, AssignmentAttachmentDTO>()
            .ForMember(d => d.DownloadUrl, o => o.MapFrom(s => "/Uploads/" + s.StoragePath.Replace('\\', '/')));

        CreateMap<HomeworkSubmissionAttachment, AssignmentAttachmentDTO>()
            .ForMember(d => d.DownloadUrl, o => o.MapFrom(s => "/Uploads/" + s.StoragePath.Replace('\\', '/')));

        CreateMap<Assignment, AssignmentDTO>()
            .ForMember(d => d.LectureTitle, o => o.MapFrom(s => s.Lecture != null ? s.Lecture.Title : null));

        CreateMap<CreateAssignmentDTO, Assignment>()
            .ForMember(d => d.Id, o => o.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.Tasks, o => o.Ignore())
            .ForMember(d => d.Attachments, o => o.Ignore())
            .ForMember(d => d.HomeworkSubmissions, o => o.Ignore())
            .ForMember(d => d.Subject, o => o.Ignore())
            .ForMember(d => d.Lecture, o => o.Ignore());

        CreateMap<UpdateAssignmentDTO, Assignment>()
            .ForMember(d => d.Kind, o => o.Ignore())
            .ForMember(d => d.SubjectId, o => o.Ignore())
            .ForMember(d => d.Tasks, o => o.Ignore())
            .ForMember(d => d.Attachments, o => o.Ignore())
            .ForMember(d => d.HomeworkSubmissions, o => o.Ignore())
            .ForMember(d => d.Subject, o => o.Ignore())
            .ForMember(d => d.Lecture, o => o.Ignore());
    }
}