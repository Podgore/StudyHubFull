using AutoMapper;
using Microsoft.AspNetCore.Http;
using StudyHub.Common.DTO.Lecture;
using StudyHub.Entities;
using System.Linq;

namespace StudyHub.BLL.Profiles;

public sealed record MaterialFileCreationArgs(Guid MaterialId, string StorageRelativePath, IFormFile File);

public sealed record MaterialVideoCreationArgs(Guid MaterialId, string StorageRelativePath, IFormFile File);

public class LectureMaterialProfile : Profile
{
    public LectureMaterialProfile()
    {
        CreateMap<AddLectureVideoMaterialRequest, LectureMaterial>()
            .ForMember(d => d.Id, o => o.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.LectureId, o => o.Ignore())
            .ForMember(d => d.Type, o => o.MapFrom(_ => MaterialType.Video))
            .ForMember(d => d.Lecture, o => o.Ignore())
            .ForMember(d => d.File, o => o.Ignore())
            .ForMember(d => d.Video, o => o.Ignore())
            .ForMember(d => d.ContentDetail, o => o.Ignore());

        CreateMap<MaterialVideoCreationArgs, MaterialVideo>()
            .ForMember(d => d.Id, o => o.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.MaterialId, o => o.MapFrom(s => s.MaterialId))
            .ForMember(d => d.StoragePath, o => o.MapFrom(s => s.StorageRelativePath))
            .ForMember(d => d.StoredFileName, o => o.MapFrom(s => s.File.FileName))
            .ForMember(d => d.MimeType, o => o.MapFrom(s =>
                string.IsNullOrEmpty(s.File.ContentType) ? "application/octet-stream" : s.File.ContentType))
            .ForMember(d => d.ExternalUrl, o => o.Ignore())
            .ForMember(d => d.DurationSeconds, o => o.Ignore())
            .ForMember(d => d.Material, o => o.Ignore());

        CreateMap<AddLectureFileMaterialRequest, LectureMaterial>()
            .ForMember(d => d.Id, o => o.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.LectureId, o => o.Ignore())
            .ForMember(d => d.Type, o => o.MapFrom(_ => MaterialType.File))
            .ForMember(d => d.Lecture, o => o.Ignore())
            .ForMember(d => d.File, o => o.Ignore())
            .ForMember(d => d.Video, o => o.Ignore())
            .ForMember(d => d.ContentDetail, o => o.Ignore());

        CreateMap<MaterialFileCreationArgs, MaterialFile>()
            .ForMember(d => d.Id, o => o.MapFrom(_ => Guid.NewGuid()))
            .ForMember(d => d.MaterialId, o => o.MapFrom(s => s.MaterialId))
            .ForMember(d => d.StoragePath, o => o.MapFrom(s => s.StorageRelativePath))
            .ForMember(d => d.FileName, o => o.MapFrom(s => s.File.FileName))
            .ForMember(d => d.MimeType, o => o.MapFrom(s =>
                string.IsNullOrEmpty(s.File.ContentType) ? "application/octet-stream" : s.File.ContentType))
            .ForMember(d => d.FileSizeBytes, o => o.MapFrom(s => s.File.Length))
            .ForMember(d => d.Material, o => o.Ignore());

        CreateMap<LectureMaterial, LectureMaterialDTO>()
            .ForMember(d => d.FileName, o => o.MapFrom(s => s.File != null ? s.File.FileName : null))
            .ForMember(d => d.MimeType, o => o.MapFrom(s => s.File != null ? s.File.MimeType : null))
            .ForMember(d => d.FileSizeBytes, o => o.MapFrom(s => s.File != null ? s.File.FileSizeBytes : (long?)null))
            .ForMember(d => d.FileDownloadUrl, o => o.MapFrom(s => s.File != null
                ? "/Uploads/" + s.File.StoragePath.Replace('\\', '/')
                : null))
            .ForMember(d => d.ExternalUrl, o => o.MapFrom(s => s.Video != null ? s.Video.ExternalUrl : null))
            .ForMember(d => d.VideoPlaybackUrl, o => o.MapFrom(s => s.Video != null && !string.IsNullOrEmpty(s.Video.StoragePath)
                ? "/Uploads/" + s.Video.StoragePath.Replace('\\', '/')
                : null))
            .ForMember(d => d.VideoMimeType, o => o.MapFrom(s => s.Video != null ? s.Video.MimeType : null))
            .ForMember(d => d.VideoStoredFileName, o => o.MapFrom(s => s.Video != null ? s.Video.StoredFileName : null))
            .ForMember(d => d.DurationSeconds, o => o.MapFrom(s => s.Video != null ? s.Video.DurationSeconds : null))
            .ForMember(d => d.TextContent, o => o.MapFrom(s => s.ContentDetail != null ? s.ContentDetail.Content : null))
            .ForMember(d => d.Language, o => o.MapFrom(s => s.ContentDetail != null ? s.ContentDetail.Language : null));

        CreateMap<Lecture, LectureDTO>()
            .ForMember(d => d.Materials, o => o.MapFrom((src, _, _, ctx) =>
                ctx.Mapper.Map<List<LectureMaterialDTO>>((src.Materials ?? Enumerable.Empty<LectureMaterial>())
                    .OrderBy(m => m.OrderIndex)
                    .ThenBy(m => m.Title)
                    .ToList())));
    }
}
