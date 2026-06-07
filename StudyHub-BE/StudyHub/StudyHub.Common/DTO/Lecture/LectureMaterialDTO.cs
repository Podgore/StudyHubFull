using StudyHub.Entities;

namespace StudyHub.Common.DTO.Lecture;

public class LectureMaterialDTO
{
    public Guid Id { get; set; }
    public Guid LectureId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsVisible { get; set; }
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
    public long? FileSizeBytes { get; set; }
    public string? FileDownloadUrl { get; set; }
    public string? ExternalUrl { get; set; }
    public string? VideoPlaybackUrl { get; set; }
    public string? VideoMimeType { get; set; }
    public string? VideoStoredFileName { get; set; }
    public int? DurationSeconds { get; set; }
    public string? TextContent { get; set; }
    public string? Language { get; set; }
}
