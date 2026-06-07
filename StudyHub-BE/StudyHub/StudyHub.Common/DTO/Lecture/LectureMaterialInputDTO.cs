using StudyHub.Entities;

namespace StudyHub.Common.DTO.Lecture;

public class LectureMaterialInputDTO
{
    public MaterialType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public bool IsVisible { get; set; } = true;
    public string? Content { get; set; }
    public string? Language { get; set; }
    public string? ExternalUrl { get; set; }
    public int? DurationSeconds { get; set; }
}
