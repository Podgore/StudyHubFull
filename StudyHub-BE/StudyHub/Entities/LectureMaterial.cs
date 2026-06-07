using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class LectureMaterial : EntityBase
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialType Type { get; set; }
    public int OrderIndex { get; set; }
    public bool IsVisible { get; set; } = true;

    [ForeignKey(nameof(Lecture))]
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; set; } = null!;
    public MaterialFile? File { get; set; }
    public MaterialVideo? Video { get; set; }
    public MaterialContent? ContentDetail { get; set; }
}