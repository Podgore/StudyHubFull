using Microsoft.AspNetCore.Http;

namespace StudyHub.Common.DTO.Lecture;

public class AddLectureVideoMaterialRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public bool IsVisible { get; set; } = true;
    public IFormFile File { get; set; } = null!;
}
