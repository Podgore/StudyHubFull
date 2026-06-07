using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class MaterialFile : EntityBase
{
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    [ForeignKey(nameof(Material))]
    public Guid MaterialId { get; set; }
    public LectureMaterial Material { get; set; } = null!;
}