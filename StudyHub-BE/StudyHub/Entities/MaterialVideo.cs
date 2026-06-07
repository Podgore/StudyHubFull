using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class MaterialVideo : EntityBase
{
    public string? ExternalUrl { get; set; }
    public string? StoragePath { get; set; }
    public string? StoredFileName { get; set; }
    public string? MimeType { get; set; }
    public int? DurationSeconds { get; set; }

    [ForeignKey(nameof(Material))]
    public Guid MaterialId { get; set; }
    public LectureMaterial Material { get; set; } = null!;
}
