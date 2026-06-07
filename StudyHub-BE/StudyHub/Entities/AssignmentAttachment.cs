using System.ComponentModel.DataAnnotations.Schema;

namespace StudyHub.Entities;

public class AssignmentAttachment : EntityBase
{
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    [ForeignKey(nameof(Assignment))]
    public Guid AssignmentId { get; set; }

    public Assignment Assignment { get; set; } = null!;
}
