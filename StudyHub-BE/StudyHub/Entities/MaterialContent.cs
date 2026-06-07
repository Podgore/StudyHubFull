using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class MaterialContent : EntityBase
{
    public string Content { get; set; } = string.Empty;
    public string? Language { get; set; }

    [ForeignKey(nameof(Material))]
    public Guid MaterialId { get; set; }
    public LectureMaterial Material { get; set; } = null!;
}